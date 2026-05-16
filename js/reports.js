Object.assign(App, {
    setReportsFilter(type) {
        this.state.reportsFilter = type;
        this.render();
    },

    setAppointmentsFilter(type) {
        this.state.appointmentsFilter = type;
        this.render();
    },

    setCustomAppointmentsRange() {
        const start = document.getElementById('apt-start-date').value;
        const end = document.getElementById('apt-end-date').value;
        if (start && end) {
            this.state.appointmentsFilter = 'custom';
            this.state.appointmentsFilterStart = start;
            this.state.appointmentsFilterEnd = end;
            this.state.isDateRangeModalOpen = false;
            this.render();
        }
    },

    setCustomReportRange() {
        const start = document.getElementById('report-start-date').value;
        const end = document.getElementById('report-end-date').value;
        if (start && end) {
            this.state.reportsCustomStart = start;
            this.state.reportsCustomEnd = end;
            this.render();
        }
    },

    setPaymentFilter(method) {
        this.state.paymentMethodFilter = method;
        this.render();
    },

    setPaymentStatusFilter(status) {
        this.state.paymentStatusFilter = status;
        this.render();
    },

    toggleReportsView(view) {
        this.state.reportsView = view;
        this.render();
        
        // Se mudou para dashboard, precisamos dar um tempo para o canvas existir no DOM antes de criar o gráfico
        if (view === 'dashboard') {
            setTimeout(() => this.initCharts(), 100);
        }
    },

    initCharts() {
        const stats = this.getAnalytics();
        if (!stats) return;

        const ctx = document.getElementById('revenueGrowthChart');
        if (!ctx) return;

        // Limpar gráfico anterior se existir
        if (window.revenueChart) {
            window.revenueChart.destroy();
        }

        const isLight = document.body.classList.contains('light-mode');

        window.revenueChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: stats.historyData.map(d => d.label),
                datasets: [{
                    label: 'Faturamento (R$)',
                    data: stats.historyData.map(d => d.value),
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#f59e0b',
                    pointBorderColor: isLight ? '#ffffff' : '#0c0c0c',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: isLight ? '#ffffff' : '#18181b',
                        titleColor: isLight ? '#71717a' : '#a1a1aa',
                        bodyColor: isLight ? '#18181b' : '#fff',
                        borderColor: isLight ? '#e4e4e7' : '#27272a',
                        borderWidth: 1,
                        padding: 10,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return 'R$ ' + context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        display: false,
                        beginAtZero: true
                    },
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: isLight ? '#71717a' : '#a1a1aa',
                            font: { size: 10, weight: 'bold' }
                        }
                    }
                }
            }
        });
    },

    exportTransactionsToCSV() {
        const txs = this.state.completedTransactions;
        if (!txs || txs.length === 0) {
            this.showNotification("Aviso", "Não há dados para exportar.");
            return;
        }

        const headers = ["ID", "Data", "Hora", "Cliente", "Serviço", "Profissional", "Pagamento", "Valor (R$)"];
        const rows = txs.map(t => [
            t.id,
            t.date,
            t.time,
            t.clientName,
            t.service.name,
            t.barberName || 'N/A',
            t.paymentMethod,
            t.numericValue.toFixed(2).replace('.', ',')
        ]);

        const csvContent = [
            headers.join(";"),
            ...rows.map(r => r.join(";"))
        ].join("\n");

        // Blob para download (UTF-8 com BOM para Excel reconhecer acentos)
        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        
        link.setAttribute("href", url);
        link.setAttribute("download", `relatorio_financeiro_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification("Sucesso", "CSV gerado com sucesso!");
    },

    // --- Relatório de Produtos ---

    setProductReportTab(tab) {
        this.state.productReportTab = tab;
        if (tab === 'products' && this.state.productSales.length === 0) {
            this.loadProductSales();
        } else {
            this.render();
        }
    },

    setProductCategoryFilter(catId) {
        this.state.productCategoryFilter = catId;
        this.render();
    },

    setProductDateFilter(filter) {
        this.state.productDateFilter = filter;
        this.loadProductSales();
    },

    setCustomProductRange() {
        const start = document.getElementById('product-start-date')?.value;
        const end = document.getElementById('product-end-date')?.value;
        if (start && end) {
            this.state.productDateStart = start;
            this.state.productDateEnd = end;
            this.state.productDateFilter = 'custom';
            this.loadProductSales();
        }
    },

    getFilteredProductItems() {
        const catFilter = this.state.productCategoryFilter;
        const sales = this.state.productSales || [];

        const allItems = [];
        sales.forEach(apt => {
            (apt.comanda_items || []).forEach(item => {
                const product = PRODUCTS.find(p => p.id === item.id);
                const category = product ? CATEGORIES.find(c => c.id === product.category_id) : null;
                const categoryId = product ? product.category_id : null;
                const categoryName = category ? category.name : 'Sem Categoria';

                if (catFilter !== 'all' && categoryId !== catFilter) return;

                allItems.push({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    qty: item.qty || 1,
                    categoryId,
                    categoryName
                });
            });
        });

        const aggregated = {};
        allItems.forEach(item => {
            const key = item.id || item.name;
            if (!aggregated[key]) {
                aggregated[key] = {
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    categoryId: item.categoryId,
                    categoryName: item.categoryName,
                    totalQty: 0,
                    totalRevenue: 0
                };
            }
            aggregated[key].totalQty += item.qty;
            aggregated[key].totalRevenue += item.price * item.qty;
        });

        const aggregatedItems = Object.values(aggregated).sort((a, b) => b.totalRevenue - a.totalRevenue);
        const totalRevenue = aggregatedItems.reduce((sum, i) => sum + i.totalRevenue, 0);
        const totalQty = aggregatedItems.reduce((sum, i) => sum + i.totalQty, 0);

        return { aggregatedItems, totalRevenue, totalQty };
    },

    exportProductsToCSV() {
        const { aggregatedItems } = this.getFilteredProductItems();
        if (!aggregatedItems || aggregatedItems.length === 0) {
            this.showNotification("Aviso", "Não há produtos para exportar no período.");
            return;
        }

        const headers = ["Produto", "Categoria", "Qtd Vendida", "Valor Unit (R$)", "Total (R$)"];
        const rows = aggregatedItems.map(item => [
            item.name,
            item.categoryName,
            item.totalQty,
            item.price.toFixed(2).replace('.', ','),
            item.totalRevenue.toFixed(2).replace('.', ',')
        ]);

        const csvContent = [
            headers.join(";"),
            ...rows.map(r => r.join(";"))
        ].join("\n");

        const blob = new Blob(["﻿" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `relatorio_produtos_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showNotification("Sucesso", "CSV de produtos gerado!");
    }
});
