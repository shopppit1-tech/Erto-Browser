package com.erto.browser;

import android.app.Dialog;
import android.os.Bundle;
import android.os.Message;
import android.view.Gravity;
import android.view.ViewGroup;
import android.view.Window;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ImageButton;
import android.graphics.Color;

import androidx.activity.OnBackPressedCallback;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(ErtoWebViewPlugin.class);
        super.onCreate(savedInstanceState);

        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView bridgeWebView = getBridge().getWebView();
            ErtoWebViewPlugin.configureWebViewSettings(bridgeWebView, false);

            // Enable popup windows (signInWithPopup / Google OAuth) inside the APK
            bridgeWebView.setWebChromeClient(new BridgeWebChromeClient(getBridge()) {
                @Override
                public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                    FrameLayout container = new FrameLayout(MainActivity.this);
                    WebView popupWebView = new WebView(MainActivity.this);
                    ErtoWebViewPlugin.configureWebViewSettings(popupWebView, false);

                    Dialog dialog = new Dialog(MainActivity.this, android.R.style.Theme_DeviceDefault_Light_NoActionBar);

                    popupWebView.setWebViewClient(new WebViewClient() {
                        @Override
                        public boolean shouldOverrideUrlLoading(WebView wv, WebResourceRequest req) {
                            if (req == null || req.getUrl() == null) return false;
                            String scheme = req.getUrl().getScheme();
                            return !"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme);
                        }

                        @Override
                        public void onPageFinished(WebView wv, String url) {
                            CookieManager.getInstance().flush();
                        }
                    });

                    popupWebView.setWebChromeClient(new WebChromeClient() {
                        @Override
                        public void onCloseWindow(WebView window) {
                            if (dialog.isShowing()) {
                                dialog.dismiss();
                            }
                            window.destroy();
                        }
                    });

                    ImageButton closeBtn = new ImageButton(MainActivity.this);
                    closeBtn.setImageResource(android.R.drawable.ic_menu_close_clear_cancel);
                    closeBtn.setBackgroundColor(Color.parseColor("#CC043B12"));
                    closeBtn.setColorFilter(Color.WHITE);
                    FrameLayout.LayoutParams btnParams = new FrameLayout.LayoutParams(110, 110, Gravity.TOP | Gravity.END);
                    btnParams.topMargin = 24;
                    btnParams.rightMargin = 24;
                    closeBtn.setOnClickListener(v -> {
                        dialog.dismiss();
                        popupWebView.destroy();
                    });

                    container.addView(popupWebView, new FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    ));
                    container.addView(closeBtn, btnParams);

                    dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
                    dialog.setContentView(container);
                    dialog.setOnDismissListener(d -> {
                        try {
                            popupWebView.destroy();
                        } catch (Throwable ignored) {}
                    });
                    dialog.show();

                    WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                    transport.setWebView(popupWebView);
                    resultMsg.sendToTarget();
                    return true;
                }
            });
        }

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (ErtoWebViewPlugin.handleHardwareBack()) {
                    return;
                }
                setEnabled(false);
                getOnBackPressedDispatcher().onBackPressed();
                setEnabled(true);
            }
        });
    }
}
