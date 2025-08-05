"use client"

import PublicWebViewer from "../../components/public-web-viewer"

export default function PublicViewerPage() {
  return <PublicWebViewer websocketUrl={process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8080/viewer"} />
}
