import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const jbMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "KINETIK_EXTRACTION // TERMINAL",
  description: "High-fidelity AI conversation log extraction and refinement.",
  other: {
    "coinzilla": "8a95edce0669039c30b73d226c3aa715",
    "6a97888e-site-verification": "d8d3b362ab851d5c6a9039018822b225",
    "Delegate-CH": "Sec-CH-UA https://s.pemsrv.com; Sec-CH-UA-Mobile https://s.pemsrv.com; Sec-CH-UA-Arch https://s.pemsrv.com; Sec-CH-UA-Model https://s.pemsrv.com; Sec-CH-UA-Platform https://s.pemsrv.com; Sec-CH-UA-Platform-Version https://s.pemsrv.com; Sec-CH-UA-Bitness https://s.pemsrv.com; Sec-CH-UA-Full-Version-List https://s.pemsrv.com; Sec-CH-UA-Full-Version https://s.pemsrv.com;"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`${jbMono.variable} ${spaceGrotesk.variable} ${inter.variable} font-body bg-background text-on-surface antialiased min-h-screen relative overflow-x-hidden`}>
        {/* THE HUSTLE: Adsterra / PopAds / Monetag Global Scripts */}
        <script src="https://pl28528141.effectivegatecpm.com/e6/7b/98/e67b98bfac791ca1d920f4555e92fb10.js" async />
        
        {/* Monetag In-Page Push */}
        <script 
          dangerouslySetInnerHTML={{
            __html: `(function(s){s.dataset.zone='10498614',s.src='https://nap5k.com/tag.min.js'})(document.body.appendChild(document.createElement('script')))`
          }}
        />

        {/* ExoClick Popunder - Fires on link clicks */}
        <script 
          dangerouslySetInnerHTML={{
            __html: `(function(){function randStr(e,t){for(var n="",r=t||"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",o=0;o<e;o++)n+=r.charAt(Math.floor(Math.random()*r.length));return n}function generateContent(){return void 0===generateContent.val&&(generateContent.val="document.dispatchEvent("+randStr(4*Math.random()+3)+");"),generateContent.val}try{Object.defineProperty(document.currentScript,"innerHTML",{get:generateContent}),Object.defineProperty(document.currentScript,"textContent",{get:generateContent})}catch(e){};var adConfig={"ads_host":"a.pemsrv.com","syndication_host":"s.pemsrv.com","idzone":5874966,"popup_fallback":false,"popup_force":false,"chrome_enabled":true,"new_tab":false,"frequency_period":1440,"frequency_count":1,"trigger_method":3,"trigger_class":"","trigger_delay":0,"capping_enabled":true,"tcf_enabled":true,"only_inline":false};window.document.querySelectorAll||(document.querySelectorAll=document.body.querySelectorAll=Object.querySelectorAll=function(e,o,t,i,n){var r=document,a=r.createStyleSheet();for(n=r.all,o=[],t=(e=e.replace(/\[for\b/gi,"[htmlFor").split(",")).length;t--;){for(a.addRule(e[t],"k:v"),i=n.length;i--;)n[i].currentStyle.k&&o.push(n[i]);a.removeRule(0)}return o});var popMagic={version:8,cookie_name:"",url:"",config:{},open_count:0,top:null,browser:null,venor_loaded:!1,venor:!1,tcfData:null,remoteLicensedDomains:["exdynsrv.com","exosrv.com","exoclick.com","opoxv.com","exacdn.com","pemsrv.com"],configTpl:{ads_host:"",syndication_host:"",idzone:"",frequency_period:720,frequency_count:1,trigger_method:1,trigger_class:"",popup_force:!1,popup_fallback:!1,chrome_enabled:!0,new_tab:!1,cat:"",tags:"",el:"",sub:"",sub2:"",sub3:"",only_inline:!1,trigger_delay:0,capping_enabled:!0,tcf_enabled:!1,cookieconsent:!0,should_fire:function(){return!0},on_redirect:null},isAdsDomainLicensed:function(){for(var e=this.config.ads_host,o=this.remoteLicensedDomains.concat([".local","localhost","127.0.0.1"]),t=0;t<o.length;t++){var i=o[t];if("s... [truncated]
          }}
        />

        {/* Monetag Push Notification Service Worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(function(e){console.log('SW registration failed:',e)});}`
          }}
        />

        {/* Overlay Effects */}
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 micro-grid opacity-5"></div>
          <div className="absolute inset-0 scanline-overlay opacity-10"></div>
        </div>
        {children}
      </body>
    </html>
  );
}
