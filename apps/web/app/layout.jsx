import "./globals.css";
import "cropperjs/dist/cropper.css";
import { config } from "@repo/config";
export const metadata = {
    title: {
        absolute: config.appName,
        default: config.appName,
        template: `%s | ${config.appName}`,
    },
};
export default function RootLayout({ children }) {
    return children;
}
