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
    }
});
