import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export interface ErtoPageState {
  url: string;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
  loading: boolean;
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
