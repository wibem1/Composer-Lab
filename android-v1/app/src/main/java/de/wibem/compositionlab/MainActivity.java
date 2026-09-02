package de.wibem.compositionlab;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.OutputStream;

public class MainActivity extends Activity {
    private static final String APP_URL = "https://wibem1.github.io/Composer-Lab/";
    private static final int REQ_OPEN_FILE = 1001;
    private static final int REQ_SAVE_FILE = 1002;

    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;
    private byte[] pendingSaveData;
    private String pendingSaveName;
    private String pendingSaveType;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(android.graphics.Color.rgb(13, 15, 19));
        getWindow().setNavigationBarColor(android.graphics.Color.rgb(13, 15, 19));

        webView = new WebView(this);
        setContentView(webView);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView webView,
                                             ValueCallback<Uri[]> filePathCallbackNew,
                                             FileChooserParams fileChooserParams) {
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(null);
                }
                filePathCallback = filePathCallbackNew;

                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{
                        "audio/midi",
                        "audio/x-midi",
                        "application/json",
                        "text/json",
                        "application/octet-stream"
                });
                try {
                    startActivityForResult(intent, REQ_OPEN_FILE);
                    return true;
                } catch (Exception ex) {
                    filePathCallback = null;
                    Toast.makeText(MainActivity.this, "Dateiauswahl konnte nicht geöffnet werden.", Toast.LENGTH_LONG).show();
                    return false;
                }
            }
        });

        webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");
        webView.loadUrl(APP_URL);
    }

    public class AndroidBridge {
        @JavascriptInterface
        public void saveBlob(String dataUrl, String fileName, String mimeType) {
            try {
                int comma = dataUrl.indexOf(',');
                if (comma < 0) throw new IllegalArgumentException("Ungültige Daten");
                String encoded = dataUrl.substring(comma + 1);
                pendingSaveData = Base64.decode(encoded, Base64.DEFAULT);
                pendingSaveName = (fileName == null || fileName.trim().isEmpty()) ? "composition.mid" : fileName;
                pendingSaveType = (mimeType == null || mimeType.trim().isEmpty()) ? "application/octet-stream" : mimeType;

                runOnUiThread(() -> {
                    Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    intent.setType(pendingSaveType);
                    intent.putExtra(Intent.EXTRA_TITLE, pendingSaveName);
                    try {
                        startActivityForResult(intent, REQ_SAVE_FILE);
                    } catch (Exception ex) {
                        Toast.makeText(MainActivity.this, "Speicherdialog konnte nicht geöffnet werden.", Toast.LENGTH_LONG).show();
                    }
                });
            } catch (Exception ex) {
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "Datei konnte nicht vorbereitet werden.", Toast.LENGTH_LONG).show());
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == REQ_OPEN_FILE) {
            if (filePathCallback != null) {
                Uri[] result = null;
                if (resultCode == RESULT_OK) {
                    result = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
                }
                filePathCallback.onReceiveValue(result);
                filePathCallback = null;
            }
            return;
        }

        if (requestCode == REQ_SAVE_FILE) {
            if (resultCode == RESULT_OK && data != null && data.getData() != null && pendingSaveData != null) {
                Uri uri = data.getData();
                try (OutputStream out = getContentResolver().openOutputStream(uri)) {
                    if (out == null) throw new IllegalStateException("Kein Ausgabestrom");
                    out.write(pendingSaveData);
                    out.flush();
                    Toast.makeText(this, "Datei gespeichert.", Toast.LENGTH_SHORT).show();
                } catch (Exception ex) {
                    Toast.makeText(this, "Speichern fehlgeschlagen.", Toast.LENGTH_LONG).show();
                }
            }
            pendingSaveData = null;
            pendingSaveName = null;
            pendingSaveType = null;
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
