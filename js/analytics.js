Object.assign(App, {
    getAnalytics() {
        const txs = this.state.completedTransactions;
        if (!txs || txs.length === 0) return null;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        // 1. Filtragem por Mês
        const currentMonthTxs = txs.filter(t => {
            const d = new Date(t.completedAt);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const lastMonthTxs = txs.filter(t => {
            const d = new Date(t.completedAt);
            return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
        });

        const currentRevenue = currentMonthTxs.reduce((s, t) => s + t.numericValue, 0);
        const lastRevenue = lastMonthTxs.reduce((s, t) => s + t.numericValue, 0);

        // 2. Crescimento
        let growth = 0;
        if (lastRevenue > 0) {
            growth = ((currentRevenue - lastRevenue) / lastRevenue) * 100;
        } else if (currentRevenue > 0) {
            growth = 100;
        }

        // 3. Ticket Médio (Mês Atual)
        const avgTicket = currentMonthTxs.length > 0 ? currentRevenue / currentMonthTxs.length : 0;

        // 4. Mix de Serviços (Geral)
        const serviceCounts = {};
        txs.forEach(t => {
            const name = t.service.name;
            serviceCounts[name] = (serviceCounts[name] || 0) + 1;
        });

        const topServices = Object.entries(serviceCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        // 5. Histórico de 6 meses para o gráfico
        const historyData = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(now.getMonth() - i);
            const m = d.getMonth();
            const y = d.getFullYear();
            
            const monthRevenue = txs.filter(t => {
                const td = new Date(t.completedAt);
                return td.getMonth() === m && td.getFullYear() === y;
            }).reduce((s, t) => s + t.numericValue, 0);

            const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
            historyData.push({
                label: `${monthNames[m]}`,
                value: monthRevenue
            });
        }

        return {
            currentRevenue,
            lastRevenue,
            growth,
            avgTicket,
            topServices,
            historyData,
            totalCount: currentMonthTxs.length
        };
    }
});
