<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Enhance ERP Inventory System</title>
        <meta name="description" content="Manage inventory and warehouse operations efficiently with a secure, scalable ERP system featuring real-time tracking, alerts, and detailed reporting.">
        <meta name="robots" content="noindex, nofollow">
        <style>
            :root {
                color-scheme: dark;
                --background: #0b1020;
                --foreground: #e2e8f0;
                --card: #111827;
                --border: rgba(148, 163, 184, 0.2);
            }
            * { box-sizing: border-box; }
            html, body { height: 100%; margin: 0; }
            body {
                background:
                    radial-gradient(circle at top left, rgba(59, 130, 246, 0.16), transparent 26%),
                    radial-gradient(circle at top right, rgba(16, 185, 129, 0.12), transparent 20%),
                    var(--background);
                color: var(--foreground);
                font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
            }
            #root { min-height: 100%; }
        </style>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
        <link rel="stylesheet" href="/assets/index-D0HuVjtI.css">
    </head>
    <body class="bg-background text-foreground min-h-screen">
        <div class="flex min-h-screen bg-background overflow-hidden lg:h-screen" style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif;">
            <aside class="fixed inset-y-0 left-0 z-30 w-60 flex flex-col bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 lg:relative lg:translate-x-0">
                <div class="flex items-center gap-2.5 px-5 h-14 border-b border-sidebar-border shrink-0">
                    <div class="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7h18"/><path d="M5 7v10"/><path d="M19 7v10"/><path d="M8 17h8"/></svg>
                    </div>
                    <div>
                        <span class="text-sm font-bold text-foreground">StockOS</span>
                        <span class="text-xs text-muted-foreground block leading-none" style="font-family: 'JetBrains Mono', monospace;">ERP v2.4</span>
                    </div>
                </div>

                <nav class="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
                    <p class="text-xs font-medium text-muted-foreground px-3 py-2 mt-1 tracking-wider">MAIN MENU</p>
                    <a href="/dashboard" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left w-full text-xs font-medium transition-all bg-sidebar-accent/60 text-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9.5 12 4l9 5.5"/><path d="M3 9.5V21"/><path d="M12 9.5V21"/><path d="M21 9.5V21"/></svg>
                        Dashboard
                    </a>
                    <a href="/inventory" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left w-full text-xs font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7h18"/><path d="M5 7v10"/><path d="M19 7v10"/><path d="M8 17h8"/></svg>
                        Inventory
                    </a>
                    <a href="/warehouses" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left w-full text-xs font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16"/><path d="M6 7v10"/><path d="M18 7v10"/><path d="M9 17h6"/></svg>
                        Warehouses
                    </a>
                    <a href="/transfers" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left w-full text-xs font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 7h10"/><path d="m14 3 4 4-4 4"/><path d="M17 17H7"/><path d="m10 21-4-4 4-4"/></svg>
                        Transfers
                    </a>
                    <a href="/transactions" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left w-full text-xs font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></svg>
                        Stock Transactions
                    </a>
                    <a href="/reports" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left w-full text-xs font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 20h18"/><path d="M6 16V10"/><path d="M12 16V4"/><path d="M18 16v-6"/></svg>
                        Reports
                    </a>

                    <p class="text-xs font-medium text-muted-foreground px-3 py-2 mt-3 tracking-wider">SYSTEM</p>
                    <a href="/users" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left w-full text-xs font-medium text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        Users
                    </a>
                    <a href="/settings" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left w-full text-xs font-medium text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4"/><path d="M12 18v4"/><path d="m4.93 4.93 2.83 2.83"/><path d="m16.24 16.24 2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="m4.93 19.07 2.83-2.83"/><path d="m16.24 7.76 2.83-2.83"/><circle cx="12" cy="12" r="3"/></svg>
                        Settings
                    </a>
                </nav>

                <div class="p-3 border-t border-sidebar-border shrink-0">
                    <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent/60 cursor-pointer transition-colors">
                        <div class="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-semibold text-blue-400">SC</div>
                        <div class="flex-1 min-w-0">
                            <p class="text-xs font-medium text-foreground truncate">Sarah Chen</p>
                            <p class="text-xs text-muted-foreground truncate">Warehouse Admin</p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>
                    </div>
                </div>
            </aside>

            <div class="flex-1 flex flex-col overflow-hidden min-w-0">
                <header class="min-h-14 flex flex-wrap items-center gap-3 px-4 lg:px-6 py-2 border-b border-border bg-background/80 backdrop-blur-sm shrink-0">
                    <button class="lg:hidden w-8 h-8 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>
                    </button>
                    <h1 class="text-sm font-semibold text-foreground capitalize">Dashboard</h1>
                    <div class="flex-1"></div>
                    <div class="relative hidden sm:block">
                        <div class="relative">
                            <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                            <input placeholder="Quick search..." class="h-9 w-full sm:w-56 rounded-lg border border-border bg-input px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none" />
                        </div>
                    </div>
                    <div class="flex items-center gap-2 ml-auto sm:ml-0">
                        <button class="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-white/15 transition-colors" aria-label="Toggle color mode">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v2"/><path d="M12 19v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M3 12h2"/><path d="M19 12h2"/><path d="m4.93 19.07 1.41-1.41"/><path d="m17.66 6.34 1.41-1.41"/><circle cx="12" cy="12" r="4"/></svg>
                        </button>
                        <div class="relative">
                            <button class="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-white/15 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>
                            </button>
                        </div>
                        <button class="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                            <div class="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-semibold text-blue-400">SC</div>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
                        </button>
                    </div>
                </header>

                <main class="flex-1 overflow-y-auto p-4 lg:p-6">
                    @yield('content')
                </main>
            </div>
        </div>
    </body>
</html>
