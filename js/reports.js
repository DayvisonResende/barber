Object.assign(App, {
    setReportsFilter(type) {
        this.state.reportsFilter = type;
        this.render();
    },

    setAppointmentsFilter(type) {
        this.state.appointmentsFilter = type;
        this.render();
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
                    pointBorderColor: '#0c0c0c',
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
                        backgroundColor: '#18181b',
                        titleColor: '#a1a1aa',
                        bodyColor: '#fff',
                        borderColor: '#27272a',
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
                            color: '#71717a',
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
    }
});
