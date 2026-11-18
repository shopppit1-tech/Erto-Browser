import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export interface ErtoPageState {
  url: string;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
  loading: boolean;
}

export interface NativeExtensionSummary {
  runtimeId: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
  xpiUrl: string;
  amoPageUrl: string;
  catalogId?: string;
}

interface ErtoWebViewPluginInterface {
  open(options: {
    url: string;
    topOffsetPx: number;
    adblock: boolean;
    dark: boolean;
    desktop: boolean;
    forceReload?: boolean;
  }): Promise<void>;
  setOptions(options: {
    adblock: boolean;
    dark: boolean;
    desktop: boolean;
    topOffsetPx?: number;
  }): Promise<void>;
  hide(): Promise<void>;
  goBack(): Promise<void>;
  goForward(): Promise<void>;
  reload(): Promise<void>;
  fetchText(options: { url: string }): Promise<{ status: number; text: string }>;
  listExtensions(): Promise<{ extensions: NativeExtensionSummary[] }>;
  installExtension(options: { catalogId: string; xpiUrl: string }): Promise<NativeExtensionSummary>;
  setExtensionEnabled(options: { runtimeId: string; enabled: boolean }): Promise<NativeExtensionSummary>;
  removeExtension(options: { runtimeId: string }): Promise<void>;
  addListener(
    eventName: 'pageState',
    listenerFunc: (state: ErtoPageState) => void
  ): Promise<PluginListenerHandle>;
}

const ErtoWebView = registerPlugin<ErtoWebViewPluginInterface>('ErtoWebView');

export function isNativeAndroidApk(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export { ErtoWebView };
