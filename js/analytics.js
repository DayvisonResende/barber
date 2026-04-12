Object.assign(App, {
    getAnalytics() {
        const txs = this.state.completedTransactions;
        const payouts = this.state.payouts || [];
        if (!txs || txs.length === 0) return null;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // 1. Configurações Financeiras
        const commissionRate = (this.state.shopSettings?.commission_rate || 100) / 100;
        const isBarber = this.state.role === 'barber';

        // 2. Filtros de Tempo (Desempenho)
        const currentMonthTxs = txs.filter(t => {
            const d = new Date(t.completedAt);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const lastMonthTxs = txs.filter(t => {
            const d = new Date(t.completedAt);
            return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
        });

        let currentRevenue = currentMonthTxs.reduce((s, t) => s + t.numericValue, 0);
        let lastRevenue = lastMonthTxs.reduce((s, t) => s + t.numericValue, 0);

        if (isBarber) {
            currentRevenue *= commissionRate;
            lastRevenue *= commissionRate;
        }

        // 3. Cálculos de Crescimento e Ticket
        let growth = 0;
        if (lastRevenue > 0) growth = ((currentRevenue - lastRevenue) / lastRevenue) * 100;
        else if (currentRevenue > 0) growth = 100;

        const avgTicket = currentMonthTxs.length > 0 ? currentRevenue / currentMonthTxs.length : 0;

        // 4. Saldo Pendente (Apenas o que NÃO foi quitado)
        // O Saldo é: (Soma de tudo que NÃO está is_settled * taxa) - (Soma de todos os avanços do barbeiro)
        const pendingTxs = txs.filter(t => !t.isSettled);
        const totalPendingEarnings = pendingTxs.reduce((s, t) => s + (t.numericValue * commissionRate), 0);
        
        // No caso do Admin, precisamos ver o saldo por barbeiro ou total? 
        // Para o dashboard geral admin o total é global. Se for barbeiro, filtra seus próprios adiantamentos.
        let totalAdvances = 0;
        if (isBarber) {
             const bId = String(this.state.userProfile?.id);
             const myPayouts = payouts.filter(p => String(p.barber_id) === bId);
             const lastFull = myPayouts.find(p => p.type === 'full');
             const lastFullTime = lastFull ? new Date(lastFull.payout_date).getTime() : 0;
             totalAdvances = myPayouts.filter(p => p.type === 'advance' && new Date(p.payout_date).getTime() > lastFullTime).reduce((s, p) => s + Number(p.amount), 0);
        } else {
             const adBys = {};
             payouts.forEach(p => {
                 if (p.type === 'full') {
                     const t = new Date(p.payout_date).getTime();
                     if (!adBys[p.barber_id] || t > adBys[p.barber_id]) adBys[p.barber_id] = t;
                 }
             });
             totalAdvances = payouts.filter(p => {
                 if (p.type !== 'advance') return false;
                 const threshold = adBys[p.barber_id] || 0;
                 return new Date(p.payout_date).getTime() > threshold;
             }).reduce((s, p) => s + Number(p.amount), 0);
        }
        
        const pendingBalance = Math.max(0, totalPendingEarnings - totalAdvances);

        // 5. Partilha Global (Admin)
        let totalBarberShare = 0;
        let totalShopShare = 0;
        txs.forEach(t => {
            const bPart = t.numericValue * commissionRate;
            totalBarberShare += bPart;
            totalShopShare += (t.numericValue - bPart);
        });

        // 6. Histórico para Gráfico (6 meses)
        const historyData = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(now.getMonth() - i);
            const m = d.getMonth();
            const y = d.getFullYear();
            
            let monthRevenue = txs.filter(t => {
                const td = new Date(t.completedAt);
                return td.getMonth() === m && td.getFullYear() === y;
            }).reduce((s, t) => s + t.numericValue, 0);

            if (isBarber) monthRevenue *= commissionRate;

            const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
            historyData.push({ label: monthNames[m], value: monthRevenue });
        }

        // 7. Mix de Serviços
        const serviceCounts = {};
        txs.forEach(t => {
            const name = t.service.name;
            serviceCounts[name] = (serviceCounts[name] || 0) + 1;
        });
        const topServices = Object.entries(serviceCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        return {
            currentRevenue,
            lastRevenue,
            growth,
            avgTicket,
            topServices,
            historyData,
            totalCount: currentMonthTxs.length,
            pendingBalance, // O VALOR REAL A PAGAR/RECEBER
            totalBarberShare,
            totalShopShare,
            commissionRate
        };
    }
});
