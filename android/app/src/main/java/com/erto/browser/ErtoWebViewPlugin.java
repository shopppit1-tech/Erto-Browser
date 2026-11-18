package com.erto.browser;

import android.annotation.SuppressLint;
import android.app.Dialog;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.os.Message;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.webkit.CookieManager;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ImageButton;

import androidx.webkit.WebSettingsCompat;
import androidx.webkit.WebViewFeature;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.InputStreamReader;
import java.lang.ref.WeakReference;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "ErtoWebView")
public class ErtoWebViewPlugin extends Plugin {

    private static final String MOBILE_UA =
        "Mozilla/5.0 (Linux; Android 14; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36";
    private static final String DESKTOP_UA =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

    private static final List<String> AD_HOSTS = Arrays.asList(
        "doubleclick.net",
        "googlesyndication.com",
        "googleadservices.com",
        "adservice.google",
        "taboola.com",
        "outbrain.com",
        "popads.net",
        "adnxs.com",
        "criteo.com",
        "amazon-adsystem.com",
        "pubmatic.com",
        "rubiconproject.com",
        "scorecardresearch.com",
        "quantserve.com"
    );

    private static WeakReference<ErtoWebViewPlugin> activeInstance;

    private WebView browserWebView;
    private Dialog popupDialog;
    private boolean adblockEnabled = true;
    private boolean darkModeEnabled = false;
    private boolean desktopModeEnabled = false;
    private String lastLoadedUrl = "";
    private final ExecutorService executor = Executors.newCachedThreadPool();

    @Override
    public void load() {
        super.load();
        activeInstance = new WeakReference<>(this);
    }

    public static boolean handleHardwareBack() {
        ErtoWebViewPlugin inst = activeInstance != null ? activeInstance.get() : null;
        if (inst == null || inst.browserWebView == null || inst.browserWebView.getVisibility() != View.VISIBLE) {
            return false;
        }
        if (inst.browserWebView.canGoBack()) {
            inst.browserWebView.goBack();
            return true;
        }
        return false;
    }

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
            try {
                WebSettingsCompat.setRequestedWithHeaderOriginAllowList(s, Collections.emptySet());
            } catch (Throwable ignored) {}
        }

        CookieManager cm = CookieManager.getInstance();
        cm.setAcceptCookie(true);
        cm.setAcceptThirdPartyCookies(wv, true);
    }

    private void ensureWebView(int topOffsetPx) {
        if (browserWebView != null) {
            updateMargins(topOffsetPx);
            return;
        }

        browserWebView = new WebView(getContext());
        configureWebViewSettings(browserWebView, desktopModeEnabled);
        browserWebView.setBackgroundColor(Color.WHITE);

        browserWebView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if (adblockEnabled && request != null && request.getUrl() != null) {
                    String host = request.getUrl().getHost();
                    if (host != null) {
                        String lower = host.toLowerCase();
                        for (String ad : AD_HOSTS) {
                            if (lower.contains(ad)) {
                                return new WebResourceResponse(
                                    "text/plain",
                                    "utf-8",
                                    new ByteArrayInputStream(new byte[0])
                                );
                            }
                        }
                    }
                }
                return super.shouldInterceptRequest(view, request);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (request == null || request.getUrl() == null) return false;
                Uri uri = request.getUrl();
                String scheme = uri.getScheme() != null ? uri.getScheme().toLowerCase() : "";
                if ("http".equals(scheme) || "https".equals(scheme)) {
                    return false;
                }
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                    getActivity().startActivity(intent);
                } catch (Throwable ignored) {}
                return true;
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                lastLoadedUrl = url;
                emitPageState(view, url, view.getTitle(), true);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                lastLoadedUrl = url;
                CookieManager.getInstance().flush();
                applyDarkReaderCss(view, darkModeEnabled);
                emitPageState(view, url, view.getTitle(), false);
            }
        });

        browserWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onReceivedTitle(WebView view, String title) {
                super.onReceivedTitle(view, title);
                emitPageState(view, view.getUrl(), title, false);
            }

            @Override
            public void onPermissionRequest(PermissionRequest request) {
                request.grant(request.getResources());
            }

            @Override
            public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                openPopupWindow(resultMsg);
                return true;
            }
        });

        ViewGroup root = getActivity().findViewById(android.R.id.content);
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        );
        params.topMargin = Math.max(0, topOffsetPx);
        root.addView(browserWebView, params);
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void openPopupWindow(Message resultMsg) {
        if (popupDialog != null && popupDialog.isShowing()) {
            popupDialog.dismiss();
        }
        FrameLayout container = new FrameLayout(getContext());
        WebView popupWv = new WebView(getContext());
        configureWebViewSettings(popupWv, false);

        Dialog dialog = new Dialog(getActivity(), android.R.style.Theme_DeviceDefault_Light_NoActionBar);
        popupDialog = dialog;

        popupWv.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (request == null || request.getUrl() == null) return false;
                String scheme = request.getUrl().getScheme();
                return !"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                CookieManager.getInstance().flush();
            }
        });

        popupWv.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onCloseWindow(WebView window) {
                if (dialog.isShowing()) {
                    dialog.dismiss();
                }
                window.destroy();
            }
        });

        ImageButton closeBtn = new ImageButton(getContext());
        closeBtn.setImageResource(android.R.drawable.ic_menu_close_clear_cancel);
        closeBtn.setBackgroundColor(Color.parseColor("#CC043B12"));
        closeBtn.setColorFilter(Color.WHITE);
        FrameLayout.LayoutParams btnParams = new FrameLayout.LayoutParams(110, 110, Gravity.TOP | Gravity.END);
        btnParams.topMargin = 24;
        btnParams.rightMargin = 24;
        closeBtn.setOnClickListener(v -> {
            dialog.dismiss();
            popupWv.destroy();
        });

        container.addView(popupWv, new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));
        container.addView(closeBtn, btnParams);

        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dialog.setContentView(container);
        dialog.setOnDismissListener(d -> {
            try {
                popupWv.destroy();
            } catch (Throwable ignored) {}
        });
        dialog.show();

        WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
        transport.setWebView(popupWv);
        resultMsg.sendToTarget();
    }

    private void updateMargins(int topOffsetPx) {
        if (browserWebView == null) return;
        ViewGroup.LayoutParams raw = browserWebView.getLayoutParams();
        if (raw instanceof FrameLayout.LayoutParams) {
            FrameLayout.LayoutParams lp = (FrameLayout.LayoutParams) raw;
            int safeTop = Math.max(0, topOffsetPx);
            if (lp.topMargin != safeTop) {
                lp.topMargin = safeTop;
                browserWebView.setLayoutParams(lp);
            }
        }
    }

    private void applyDarkReaderCss(WebView wv, boolean enable) {
        if (wv == null) return;
        String js = enable
            ? "(function(){var s=document.getElementById('erto-dark-reader');if(!s){s=document.createElement('style');s.id='erto-dark-reader';s.textContent='html{filter:invert(0.92) hue-rotate(180deg) !important;background:#0b1220 !important;}img,video,picture,canvas,[style*=\"background-image\"]{filter:invert(1) hue-rotate(180deg) !important;}';document.head&&document.head.appendChild(s);}})();"
            : "(function(){var s=document.getElementById('erto-dark-reader');if(s)s.remove();})();";
        wv.evaluateJavascript(js, null);
    }

    private void emitPageState(WebView wv, String url, String title, boolean loading) {
        JSObject data = new JSObject();
        data.put("url", url != null ? url : "");
        data.put("title", title != null ? title : "");
        data.put("canGoBack", wv != null && wv.canGoBack());
        data.put("canGoForward", wv != null && wv.canGoForward());
        data.put("loading", loading);
        notifyListeners("pageState", data);
    }

    @PluginMethod
    public void open(PluginCall call) {
        String url = call.getString("url", "");
        int topOffsetPx = call.getInt("topOffsetPx", 220);
        boolean adblock = Boolean.TRUE.equals(call.getBoolean("adblock", true));
        boolean dark = Boolean.TRUE.equals(call.getBoolean("dark", false));
        boolean desktop = Boolean.TRUE.equals(call.getBoolean("desktop", false));
        boolean forceReload = Boolean.TRUE.equals(call.getBoolean("forceReload", false));

        if (url == null || url.isEmpty()) {
            call.reject("URL kosong");
            return;
        }

        getActivity().runOnUiThread(() -> {
            adblockEnabled = adblock;
            darkModeEnabled = dark;
            boolean uaChanged = desktopModeEnabled != desktop;
            desktopModeEnabled = desktop;

            ensureWebView(topOffsetPx);
            if (uaChanged) {
                browserWebView.getSettings().setUserAgentString(desktop ? DESKTOP_UA : MOBILE_UA);
            }
            browserWebView.setVisibility(View.VISIBLE);
            browserWebView.bringToFront();

            if (forceReload || !url.equals(lastLoadedUrl)) {
                lastLoadedUrl = url;
                browserWebView.loadUrl(url);
            } else {
                applyDarkReaderCss(browserWebView, darkModeEnabled);
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void setOptions(PluginCall call) {
        boolean adblock = Boolean.TRUE.equals(call.getBoolean("adblock", adblockEnabled));
        boolean dark = Boolean.TRUE.equals(call.getBoolean("dark", darkModeEnabled));
        boolean desktop = Boolean.TRUE.equals(call.getBoolean("desktop", desktopModeEnabled));
        int topOffsetPx = call.getInt("topOffsetPx", -1);

        getActivity().runOnUiThread(() -> {
            adblockEnabled = adblock;
            darkModeEnabled = dark;
            if (browserWebView != null) {
                if (topOffsetPx >= 0) updateMargins(topOffsetPx);
                if (desktopModeEnabled != desktop) {
                    desktopModeEnabled = desktop;
                    browserWebView.getSettings().setUserAgentString(desktop ? DESKTOP_UA : MOBILE_UA);
                    browserWebView.reload();
                } else {
                    applyDarkReaderCss(browserWebView, darkModeEnabled);
                }
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void hide(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (browserWebView != null) {
                browserWebView.setVisibility(View.GONE);
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void goBack(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (browserWebView != null && browserWebView.canGoBack()) {
                browserWebView.goBack();
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void goForward(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (browserWebView != null && browserWebView.canGoForward()) {
                browserWebView.goForward();
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void reload(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (browserWebView != null) {
                browserWebView.reload();
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void fetchText(PluginCall call) {
        String targetUrl = call.getString("url", "");
        if (targetUrl == null || (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://"))) {
            call.reject("URL tidak valid");
            return;
        }
        executor.execute(() -> {
            HttpURLConnection conn = null;
            try {
                URL url = new URL(targetUrl);
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(8000);
                conn.setReadTimeout(8000);
                conn.setInstanceFollowRedirects(true);
                conn.setRequestProperty("User-Agent", DESKTOP_UA);
                conn.setRequestProperty("Accept-Language", "id-ID,id;q=0.9,en-US;q=0.8");

                int status = conn.getResponseCode();
                BufferedReader reader = new BufferedReader(
                    new InputStreamReader(
                        status >= 400 ? conn.getErrorStream() : conn.getInputStream(),
                        StandardCharsets.UTF_8
                    )
                );
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line).append('\n');
                }
                reader.close();

                JSObject res = new JSObject();
                res.put("status", status);
                res.put("text", sb.toString());
                call.resolve(res);
            } catch (Exception ex) {
                call.reject(ex.getMessage() != null ? ex.getMessage() : "Fetch gagal");
            } finally {
                if (conn != null) conn.disconnect();
            }
        });
    }
}
