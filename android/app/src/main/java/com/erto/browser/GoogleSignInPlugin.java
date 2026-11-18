package com.erto.browser;

import android.app.Activity;
import android.os.CancellationSignal;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.credentials.ClearCredentialStateRequest;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.ClearCredentialException;
import androidx.credentials.exceptions.GetCredentialException;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.libraries.identity.googleid.GetGoogleIdOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

import java.util.concurrent.Executor;

@CapacitorPlugin(name = "GoogleSignIn")
public class GoogleSignInPlugin extends Plugin {
    private static final String GOOGLE_ID_TOKEN_TYPE =
        GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL;

    @PluginMethod
    public void signIn(PluginCall call) {
        String serverClientId = call.getString("serverClientId", "");
        if (serverClientId == null || !serverClientId.endsWith(".apps.googleusercontent.com")) {
            call.reject("Konfigurasi Google Client ID tidak valid.", "auth/google-config-error");
            return;
        }

        Activity activity = getActivity();
        if (activity == null || activity.isFinishing()) {
            call.reject("Activity login Google belum siap.", "auth/google-sign-in-failed");
            return;
        }

        GetGoogleIdOption googleIdOption = new GetGoogleIdOption.Builder()
            .setFilterByAuthorizedAccounts(false)
            .setServerClientId(serverClientId)
            .setAutoSelectEnabled(false)
            .build();
        GetCredentialRequest request = new GetCredentialRequest.Builder()
            .addCredentialOption(googleIdOption)
            .build();

        CredentialManager credentialManager = CredentialManager.create(activity);
        Executor callbackExecutor = ContextCompat.getMainExecutor(activity);
        credentialManager.getCredentialAsync(
            activity,
            request,
            new CancellationSignal(),
            callbackExecutor,
            new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                @Override
                public void onResult(GetCredentialResponse response) {
                    handleCredential(call, response.getCredential());
                }

                @Override
                public void onError(@NonNull GetCredentialException exception) {
                    String type = exception.getType() == null ? "" : exception.getType();
                    if (type.endsWith("TYPE_USER_CANCELED")) {
                        call.reject("Login Google dibatalkan.", "auth/cancelled-popup-request");
                    } else if (type.endsWith("TYPE_NO_CREDENTIAL")) {
                        call.reject("Tidak ada akun Google yang dapat dipilih di perangkat ini.", "auth/no-credential");
                    } else {
                        call.reject("Login Google gagal: " + safeMessage(exception), "auth/google-sign-in-failed");
                    }
                }
            }
        );
    }

    private void handleCredential(PluginCall call, Credential credential) {
        if (!(credential instanceof CustomCredential) || !GOOGLE_ID_TOKEN_TYPE.equals(credential.getType())) {
            call.reject("Google tidak mengembalikan kredensial ID token yang valid.", "auth/invalid-credential");
            return;
        }

        try {
            GoogleIdTokenCredential googleCredential = GoogleIdTokenCredential.createFrom(credential.getData());
            String idToken = googleCredential.getIdToken();
            if (idToken == null || idToken.isEmpty()) {
                call.reject("Token Google kosong.", "auth/invalid-credential");
                return;
            }

            JSObject result = new JSObject();
            result.put("idToken", idToken);
            result.put("email", googleCredential.getId());
            result.put("displayName", googleCredential.getDisplayName());
            result.put("photoUrl", googleCredential.getProfilePictureUri() == null
                ? null
                : googleCredential.getProfilePictureUri().toString());
            call.resolve(result);
        } catch (Exception exception) {
            call.reject("Kredensial Google tidak dapat dibaca.", "auth/invalid-credential");
        }
    }

    @PluginMethod
    public void clearCredentialState(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null || activity.isFinishing()) {
            call.resolve();
            return;
        }

        CredentialManager credentialManager = CredentialManager.create(activity);
        credentialManager.clearCredentialStateAsync(
            new ClearCredentialStateRequest(),
            new CancellationSignal(),
            ContextCompat.getMainExecutor(activity),
            new CredentialManagerCallback<Void, ClearCredentialException>() {
                @Override
                public void onResult(Void result) {
                    call.resolve();
                }

                @Override
                public void onError(@NonNull ClearCredentialException exception) {
                    // Firebase Web Auth is already signed out; clear-state failure must not undo it.
                    call.resolve();
                }
            }
        );
    }

    private static String safeMessage(Exception exception) {
        String message = exception.getMessage();
        if (message == null || message.trim().isEmpty()) return "Periksa koneksi dan konfigurasi Google.";
        return message.replace('\n', ' ').trim();
    }
}
