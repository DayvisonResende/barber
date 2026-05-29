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

        const isLight = this.state.theme !== 'dark';

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

    setProductStatusFilter(status) {
        this.state.productStatusFilter = status;
        this.render();
    },

    getFilteredProductItems() {
        const catFilter = this.state.productCategoryFilter;
        const statusFilter = this.state.productStatusFilter || 'pending';
        const rawSales = this.state.productSales || [];
        const sales = statusFilter === 'pending'
            ? rawSales.filter(a => !a.is_settled)
            : rawSales.filter(a => a.is_settled);
        const isBarber = this.state.role === 'barber';

        const allItems = [];
        sales.forEach(apt => {
            (apt.comanda_items || []).forEach(item => {
                const product = PRODUCTS.find(p => p.id === item.id);
                const category = product ? CATEGORIES.find(c => c.id === product.category_id) : null;
                const categoryId = product ? product.category_id : null;
                const categoryName = category ? category.name : 'Sem Categoria';

                if (catFilter !== 'all' && categoryId !== catFilter) return;

                const qty = item.qty || 1;
                const commissionRate = item.commission_rate != null ? item.commission_rate / 100 : 0;
                const earnedValue = isBarber
                    ? item.price * qty * commissionRate
                    : item.price * qty;

                allItems.push({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    qty,
                    commissionRate: item.commission_rate,
                    earnedValue,
                    categoryId,
                    categoryName,
                    date: apt.date,
                    clientName: apt.client_name
                });
            });
        });

        allItems.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));

        const totalRevenue = allItems.reduce((sum, i) => sum + i.earnedValue, 0);
        const totalQty = allItems.reduce((sum, i) => sum + i.qty, 0);
        const distinctCount = new Set(allItems.map(i => i.id || i.name)).size;

        return { saleItems: allItems, totalRevenue, totalQty, isBarber, distinctCount };
    },

    exportProductsToCSV() {
        const { saleItems } = this.getFilteredProductItems();
        if (!saleItems || saleItems.length === 0) {
            this.showNotification("Aviso", "Não há produtos para exportar no período.");
            return;
        }

        const headers = ["Data", "Cliente", "Produto", "Categoria", "Qtd", "Valor Unit (R$)", "Total (R$)"];
        const rows = saleItems.map(item => [
            item.date || '',
            item.clientName || '',
            item.name,
            item.categoryName,
            item.qty,
            item.price.toFixed(2).replace('.', ','),
            item.earnedValue.toFixed(2).replace('.', ',')
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
