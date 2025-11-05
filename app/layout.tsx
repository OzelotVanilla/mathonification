"use client"

import "@ant-design/v5-patch-for-react-19";
import "./layout.scss"

export default function RootLayout({ children }: { children: React.ReactNode })
{
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    )
}