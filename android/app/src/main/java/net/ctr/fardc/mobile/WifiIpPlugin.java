package net.ctr.fardc.mobile;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.LinkProperties;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.net.Inet4Address;
import java.net.InetAddress;

/**
 * Plugin Capacitor natif pour obtenir l'adresse IP locale WiFi.
 * Utilisé par l'app mobile pour la détection automatique du serveur.
 */
@CapacitorPlugin(name = "WifiIp")
public class WifiIpPlugin extends Plugin {

    @PluginMethod()
    public void getWifiIP(PluginCall call) {
        try {
            String ip = getWifiIpAddress();
            if (ip != null && !ip.isEmpty()) {
                JSObject ret = new JSObject();
                ret.put("ip", ip);
                call.resolve(ret);
            } else {
                call.reject("Aucune adresse IP WiFi détectée");
            }
        } catch (Exception e) {
            call.reject("Erreur lors de la détection IP: " + e.getMessage());
        }
    }

    private String getWifiIpAddress() {
        Context context = getContext();

        // Méthode 1 : ConnectivityManager (API 23+)
        ConnectivityManager cm = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm != null) {
            Network activeNetwork = cm.getActiveNetwork();
            if (activeNetwork != null) {
                NetworkCapabilities caps = cm.getNetworkCapabilities(activeNetwork);
                if (caps != null && caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
                    LinkProperties linkProps = cm.getLinkProperties(activeNetwork);
                    if (linkProps != null) {
                        for (InetAddress addr : linkProps.getLinkAddresses().stream()
                                .map(la -> la.getAddress())
                                .toArray(InetAddress[]::new)) {
                            if (addr instanceof Inet4Address && !addr.isLoopbackAddress()) {
                                return addr.getHostAddress();
                            }
                        }
                    }
                }
            }
        }

        // Méthode 2 : WifiManager (fallback)
        WifiManager wifiManager = (WifiManager) context.getApplicationContext()
                .getSystemService(Context.WIFI_SERVICE);
        if (wifiManager != null) {
            WifiInfo wifiInfo = wifiManager.getConnectionInfo();
            int ipInt = wifiInfo.getIpAddress();
            if (ipInt != 0) {
                return String.format("%d.%d.%d.%d",
                        (ipInt & 0xff), (ipInt >> 8 & 0xff),
                        (ipInt >> 16 & 0xff), (ipInt >> 24 & 0xff));
            }
        }

        return null;
    }
}
