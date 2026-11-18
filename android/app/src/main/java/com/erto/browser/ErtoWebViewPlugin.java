package com.erto.browser;

import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.graphics.Color;
import android.net.Uri;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.webkit.WebSettingsCompat;
import androidx.webkit.WebViewFeature;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONObject;

import org.mozilla.geckoview.GeckoRuntime;
import org.mozilla.geckoview.GeckoResult;
import org.mozilla.geckoview.GeckoSession;
import org.mozilla.geckoview.GeckoView;
import org.mozilla.geckoview.WebExtension;
import org.mozilla.geckoview.WebExtensionController;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.lang.ref.WeakReference;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.Arrays;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "ErtoWebView")
public class ErtoWebViewPlugin extends Plugin {
    private static final String MOBILE_UA =
        "Mozilla/5.0 (Linux; Android 14; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36";
    private static final String DESKTOP_UA =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
    private static final String EXTENSION_URI = "resource://android/assets/extensions/erto-bridge/";
    private static final String EXTENSION_ID = "extensions@erto.browser";

    private static WeakReference<ErtoWebViewPlugin> activeInstance;
    private GeckoRuntime runtime;
    private GeckoSession browserSession;
    private GeckoView browserView;
    private WebExtension privacyExtension;
    private boolean adblockEnabled = true;
    private boolean darkModeEnabled = false;
    private boolean desktopModeEnabled = false;
    private boolean canGoBack = false;
    private boolean canGoForward = false;
    private boolean promptDelegateConfigured = false;
    private String lastLoadedUrl = "";
    private WebExtension.Port messagePort;
    private final ExecutorService executor = Executors.newCachedThreadPool();

    @Override
    public void load() {
        super.load();
        activeInstance = new WeakReference<>(this);
    }

    private WebExtensionController getExtensionController() {
        if (runtime == null) runtime = GeckoRuntime.getDefault(getContext());
        WebExtensionController controller = runtime.getWebExtensionController();
        if (!promptDelegateConfigured) {
            controller.setPromptDelegate(new WebExtensionController.PromptDelegate() {
                @Override
                public GeckoResult<WebExtension.PermissionPromptResponse> onInstallPromptRequest(
                        WebExtension extension, String[] permissions, String[] origins,
                        String[] dataCollectionPermissions) {
                    GeckoResult<WebExtension.PermissionPromptResponse> result = new GeckoResult<>();
                    android.app.Activity activity = getActivity();
                    if (activity == null) {
                        result.complete(new WebExtension.PermissionPromptResponse(false, false, false));
                        return result;
                    }
                    StringBuilder message = new StringBuilder("Izin yang diminta:");
                    if (permissions != null && permissions.length > 0) {
                        message.append("\n\nAPI: ").append(Arrays.toString(permissions));
                    }
                    if (origins != null && origins.length > 0) {
                        message.append("\n\nAkses situs: ").append(Arrays.toString(origins));
                    }
                    if (dataCollectionPermissions != null && dataCollectionPermissions.length > 0) {
                        message.append("\n\nPengumpulan data: ").append(Arrays.toString(dataCollectionPermissions));
                    }
                    message.append("\n\nAkses mode penyamaran tidak diaktifkan.");
                    AtomicBoolean answered = new AtomicBoolean(false);
                    activity.runOnUiThread(() -> new AlertDialog.Builder(activity)
                        .setTitle("Izinkan " + extension.metaData.name)
                        .setMessage(message.toString())
                        .setPositiveButton("Izinkan & pasang", (dialog, which) -> {
                            if (answered.compareAndSet(false, true)) {
                                result.complete(new WebExtension.PermissionPromptResponse(
                                    true, false, dataCollectionPermissions != null && dataCollectionPermissions.length > 0));
                            }
                        })
                        .setNegativeButton("Batal", (dialog, which) -> {
                            if (answered.compareAndSet(false, true)) {
                                result.complete(new WebExtension.PermissionPromptResponse(false, false, false));
                            }
                        })
                        .setOnCancelListener(dialog -> {
                            if (answered.compareAndSet(false, true)) {
                                result.complete(new WebExtension.PermissionPromptResponse(false, false, false));
                            }
                        })
                        .show());
                    return result;
                }
            });
            promptDelegateConfigured = true;
        }
        return controller;
    }

    // The Capacitor shell still uses this configuration for its own bridge WebView.
    @SuppressLint("SetJavaScriptEnabled")
    public static void configureWebViewSettings(WebView wv, boolean desktop) {
        WebSettings s = wv.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setBuiltInZoomControls(true);
        s.setDisplayZoomControls(false);
        s.setJavaScriptCanOpenWindowsAutomatically(true);
        s.setSupportMultipleWindows(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        s.setUserAgentString(desktop ? DESKTOP_UA : MOBILE_UA);
        if (WebViewFeature.isFeatureSupported(WebViewFeature.REQUESTED_WITH_HEADER_ALLOW_LIST)) {
            try { WebSettingsCompat.setRequestedWithHeaderOriginAllowList(s, java.util.Collections.emptySet()); }
            catch (Throwable ignored) {}
        }
        CookieManager cm = CookieManager.getInstance();
        cm.setAcceptCookie(true);
        cm.setAcceptThirdPartyCookies(wv, true);
    }

    public static boolean handleHardwareBack() {
        ErtoWebViewPlugin inst = activeInstance == null ? null : activeInstance.get();
        if (inst == null || inst.browserSession == null || inst.browserView == null
                || inst.browserView.getVisibility() != View.VISIBLE) return false;
        if (inst.canGoBack) {
            inst.browserSession.goBack();
            return true;
        }
        return false;
    }

    private void emitPageState(String url, String title, boolean loading) {
        JSObject state = new JSObject();
        state.put("url", url == null ? "" : url);
        state.put("title", title == null ? "" : title);
        state.put("canGoBack", canGoBack);
        state.put("canGoForward", canGoForward);
        state.put("loading", loading);
        notifyListeners("pageState", state);
    }

    private void applyDarkReaderCss() {
        if (messagePort == null) return;
        try {
            JSONObject message = new JSONObject();
            message.put("type", "darkMode");
            message.put("enabled", darkModeEnabled);
            messagePort.postMessage(message);
        } catch (org.json.JSONException ignored) {}
    }

    private void syncExtensionState() {
        if (privacyExtension == null || runtime == null) return;
        WebExtensionController controller = runtime.getWebExtensionController();
        if (adblockEnabled) controller.enable(privacyExtension, WebExtensionController.EnableSource.USER);
        else controller.disable(privacyExtension, WebExtensionController.EnableSource.USER);
    }

    private void ensureBrowser(int topOffsetPx) {
        if (browserView != null) {
            updateMargins(topOffsetPx);
            return;
        }
        getExtensionController();
        browserSession = new GeckoSession();
        getExtensionController().ensureBuiltIn(EXTENSION_URI, EXTENSION_ID)
            .accept(extension -> {
                privacyExtension = extension;
                browserSession.getWebExtensionController().setMessageDelegate(extension, new WebExtension.MessageDelegate() {
                    @Override public void onConnect(WebExtension.Port port) {
                        messagePort = port;
                        port.setDelegate(new WebExtension.PortDelegate() {
                            @Override public void onPortMessage(Object message, WebExtension.Port source) {
                                if (source == messagePort) applyDarkReaderCss();
                            }
                            @Override public void onDisconnect(WebExtension.Port source) {
                                if (source == messagePort) messagePort = null;
                            }
                        });
                        applyDarkReaderCss();
                    }
                }, "erto");
                syncExtensionState();
            }, error -> {});

        browserSession.setNavigationDelegate(new GeckoSession.NavigationDelegate() {
            @Override
            public void onLocationChange(GeckoSession session, String url,
                    List<GeckoSession.PermissionDelegate.ContentPermission> permissions,
                    Boolean hasUserGesture) {
                lastLoadedUrl = url == null ? "" : url;
                emitPageState(lastLoadedUrl, "", false);
            }
            @Override public void onCanGoBack(GeckoSession session, boolean value) {
                canGoBack = value;
                emitPageState(lastLoadedUrl, "", false);
            }
            @Override public void onCanGoForward(GeckoSession session, boolean value) {
                canGoForward = value;
                emitPageState(lastLoadedUrl, "", false);
            }
        });
        browserSession.setProgressDelegate(new GeckoSession.ProgressDelegate() {
            @Override public void onPageStart(GeckoSession session, String url) {
                lastLoadedUrl = url == null ? "" : url;
                emitPageState(lastLoadedUrl, "", true);
            }
            @Override public void onPageStop(GeckoSession session, boolean success) {
                applyDarkReaderCss();
                emitPageState(lastLoadedUrl, "", false);
            }
        });
        browserSession.open(runtime);

        browserView = new GeckoView(getContext());
        browserView.setBackgroundColor(Color.WHITE);
        browserView.setSession(browserSession);
        ViewGroup root = getActivity().findViewById(android.R.id.content);
        android.widget.FrameLayout.LayoutParams params = new android.widget.FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
        params.topMargin = Math.max(0, topOffsetPx);
        root.addView(browserView, params);
    }

    private void updateMargins(int topOffsetPx) {
        if (browserView == null) return;
        ViewGroup.LayoutParams raw = browserView.getLayoutParams();
        if (raw instanceof android.widget.FrameLayout.LayoutParams) {
            android.widget.FrameLayout.LayoutParams lp = (android.widget.FrameLayout.LayoutParams) raw;
            lp.topMargin = Math.max(0, topOffsetPx);
            browserView.setLayoutParams(lp);
        }
    }

    @PluginMethod
    public void open(PluginCall call) {
        String url = call.getString("url", "");
        int topOffsetPx = call.getInt("topOffsetPx", 220);
        adblockEnabled = Boolean.TRUE.equals(call.getBoolean("adblock", true));
        darkModeEnabled = Boolean.TRUE.equals(call.getBoolean("dark", false));
        boolean desktop = Boolean.TRUE.equals(call.getBoolean("desktop", false));
        boolean forceReload = Boolean.TRUE.equals(call.getBoolean("forceReload", false));
        if (url == null || url.isEmpty()) { call.reject("URL kosong"); return; }
        getActivity().runOnUiThread(() -> {
            ensureBrowser(topOffsetPx);
            if (desktopModeEnabled != desktop) {
                desktopModeEnabled = desktop;
                browserSession.getSettings().setUserAgentOverride(desktop ? DESKTOP_UA : MOBILE_UA);
            }
            syncExtensionState();
            browserView.setVisibility(View.VISIBLE);
            browserView.bringToFront();
            if (forceReload || !url.equals(lastLoadedUrl)) {
                lastLoadedUrl = url;
                browserSession.loadUri(url);
            } else applyDarkReaderCss();
            call.resolve();
        });
    }

    @PluginMethod
    public void setOptions(PluginCall call) {
        adblockEnabled = Boolean.TRUE.equals(call.getBoolean("adblock", adblockEnabled));
        darkModeEnabled = Boolean.TRUE.equals(call.getBoolean("dark", darkModeEnabled));
        boolean desktop = Boolean.TRUE.equals(call.getBoolean("desktop", desktopModeEnabled));
        int topOffsetPx = call.getInt("topOffsetPx", -1);
        getActivity().runOnUiThread(() -> {
            if (topOffsetPx >= 0) updateMargins(topOffsetPx);
            if (browserSession != null && desktopModeEnabled != desktop) {
                desktopModeEnabled = desktop;
                browserSession.getSettings().setUserAgentOverride(desktop ? DESKTOP_UA : MOBILE_UA);
                browserSession.reload();
            }
            syncExtensionState();
            applyDarkReaderCss();
            call.resolve();
        });
    }

    @PluginMethod public void hide(PluginCall call) {
        getActivity().runOnUiThread(() -> { if (browserView != null) browserView.setVisibility(View.GONE); call.resolve(); });
    }
    @PluginMethod public void goBack(PluginCall call) {
        getActivity().runOnUiThread(() -> { if (browserSession != null && canGoBack) browserSession.goBack(); call.resolve(); });
    }
    @PluginMethod public void goForward(PluginCall call) {
        getActivity().runOnUiThread(() -> { if (browserSession != null && canGoForward) browserSession.goForward(); call.resolve(); });
    }
    @PluginMethod public void reload(PluginCall call) {
        getActivity().runOnUiThread(() -> { if (browserSession != null) browserSession.reload(); call.resolve(); });
    }

    @PluginMethod
    public void fetchText(PluginCall call) {
        String targetUrl = call.getString("url", "");
        if (targetUrl == null || (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://"))) {
            call.reject("URL tidak valid"); return;
        }
        executor.execute(() -> {
            HttpURLConnection conn = null;
            try {
                conn = (HttpURLConnection) new URL(targetUrl).openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(8000);
                conn.setReadTimeout(8000);
                conn.setInstanceFollowRedirects(true);
                conn.setRequestProperty("User-Agent", DESKTOP_UA);
                int status = conn.getResponseCode();
                BufferedReader reader = new BufferedReader(new InputStreamReader(
                    status >= 400 ? conn.getErrorStream() : conn.getInputStream()));
                StringBuilder body = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) body.append(line).append('\n');
                JSObject result = new JSObject();
                result.put("status", status);
                result.put("text", body.toString());
                call.resolve(result);
            } catch (Throwable error) { call.reject("Gagal mengambil halaman", error.toString()); }
            finally { if (conn != null) conn.disconnect(); }
        });
    }

    private JSObject extensionToJS(WebExtension extension) {
        JSObject item = new JSObject();
        item.put("runtimeId", extension.id);
        item.put("name", extension.metaData.name == null ? "" : extension.metaData.name);
        item.put("description", extension.metaData.description == null ? "" : extension.metaData.description);
        item.put("version", extension.metaData.version == null ? "" : extension.metaData.version);
        item.put("enabled", extension.metaData.enabled);
        item.put("xpiUrl", extension.metaData.downloadUrl == null ? "" : extension.metaData.downloadUrl);
        item.put("amoPageUrl", extension.metaData.amoListingUrl == null ? "" : extension.metaData.amoListingUrl);
        return item;
    }

    @PluginMethod
    public void listExtensions(PluginCall call) {
        WebExtensionController controller = getExtensionController();
        controller.list().accept(extensions -> {
            List<JSObject> result = new ArrayList<>();
            for (WebExtension extension : extensions) {
                if (!EXTENSION_ID.equals(extension.id)) result.add(extensionToJS(extension));
            }
            JSObject response = new JSObject();
            response.put("extensions", result);
            call.resolve(response);
        }, error -> call.reject("Gagal membaca daftar ekstensi: " + error));
    }

    @PluginMethod
    public void installExtension(PluginCall call) {
        String xpiUrl = call.getString("xpiUrl", "");
        String catalogId = call.getString("catalogId", "");
        Uri uri = Uri.parse(xpiUrl == null ? "" : xpiUrl);
        if (!"https".equalsIgnoreCase(uri.getScheme())
                || !"addons.mozilla.org".equalsIgnoreCase(uri.getHost())
                || uri.getPath() == null || !uri.getPath().endsWith(".xpi")) {
            call.reject("Sumber ekstensi harus berupa XPI HTTPS dari addons.mozilla.org");
            return;
        }

        WebExtensionController controller = getExtensionController();
        controller.install(uri.toString(), WebExtensionController.INSTALLATION_METHOD_MANAGER)
            .accept(extension -> controller.enable(extension, WebExtensionController.EnableSource.USER)
                .accept(enabledExtension -> {
                    JSObject result = extensionToJS(enabledExtension);
                    result.put("catalogId", catalogId == null ? "" : catalogId);
                    call.resolve(result);
                }, error -> call.reject("Ekstensi terpasang tetapi gagal diaktifkan: " + error)),
                error -> call.reject("Pemasangan ekstensi gagal: " + error));
    }

    @PluginMethod
    public void setExtensionEnabled(PluginCall call) {
        String runtimeId = call.getString("runtimeId", "");
        boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled", false));
        WebExtensionController controller = getExtensionController();
        controller.list().accept(extensions -> {
            for (WebExtension extension : extensions) {
                if (!extension.id.equals(runtimeId) || EXTENSION_ID.equals(extension.id)) continue;
                GeckoResult<WebExtension> result = enabled
                    ? controller.enable(extension, WebExtensionController.EnableSource.USER)
                    : controller.disable(extension, WebExtensionController.EnableSource.USER);
                result.accept(updated -> call.resolve(extensionToJS(updated)),
                    error -> call.reject("Gagal mengubah status ekstensi: " + error));
                return;
            }
            call.reject("Ekstensi tidak ditemukan di GeckoView");
        }, error -> call.reject("Gagal membaca daftar ekstensi", error.toString()));
    }

    @PluginMethod
    public void removeExtension(PluginCall call) {
        String runtimeId = call.getString("runtimeId", "");
        WebExtensionController controller = getExtensionController();
        controller.list().accept(extensions -> {
            for (WebExtension extension : extensions) {
                if (!extension.id.equals(runtimeId) || EXTENSION_ID.equals(extension.id)) continue;
                controller.uninstall(extension).accept(value -> call.resolve(),
                    error -> call.reject("Gagal menghapus ekstensi: " + error));
                return;
            }
            call.reject("Ekstensi tidak ditemukan di GeckoView");
        }, error -> call.reject("Gagal membaca daftar ekstensi", error.toString()));
    }
}
