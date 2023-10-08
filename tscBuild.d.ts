import { Plugin } from "vite";
export interface ViteTscBuildPluginOptions {
    enabled?: boolean;
    tsc?: string[];
}
export default function tscBuildPlugin({ enabled, tsc, }?: ViteTscBuildPluginOptions): Plugin;
