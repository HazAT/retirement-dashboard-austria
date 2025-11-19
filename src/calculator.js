export const calculator = {
    getTotalAssets(assets) {
        return assets.reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0);
    },

    getTotalMonthlyIncome(incomes) {
        return incomes.reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0);
    },

    getSafeMonthlyWithdrawal(totalAssets, rate) {
        // Annual withdrawal = Total Assets * (Rate / 100)
        // Monthly = Annual / 12
        return (totalAssets * (rate / 100)) / 12;
    },

    // Calculate the budget for the "Gap" phase (Early Retirement -> Pension Age)
    getGapBudget(assets, incomes, settings) {
        if (settings.withdrawalStrategy === 'fixed') {
            return parseFloat(settings.targetMonthlyIncome) || 0;
        }

        const totalAssets = this.getTotalAssets(assets);
        const monthlyRental = this.getTotalMonthlyIncome(incomes);
        const monthlyWithdrawal = this.getSafeMonthlyWithdrawal(totalAssets, settings.safeWithdrawalRate);

        return monthlyWithdrawal + monthlyRental;
    },

    // Calculate the budget for the "Pension" phase (Pension Age+)
    getPensionPhaseBudget(assets, incomes, settings) {
        const gapBudget = this.getGapBudget(assets, incomes, settings);
        return gapBudget + (parseFloat(settings.expectedPension) || 0);
    },

    getRealNetReturn(nominal, inflation, tax) {
        // 1. Calculate After-Tax Nominal Return
        // Tax is only applied to the gain.
        // Nominal Return = 7% -> Gain is 0.07
        // Tax = 27.5% -> Tax Amount = 0.07 * 0.275 = 0.01925
        // After-Tax Nominal = 0.07 - 0.01925 = 0.05075 (5.075%)
        const afterTaxNominal = (nominal / 100) * (1 - tax / 100);

        // 2. Calculate Real Return (Fisher Equation approximation or exact)
        // Exact: (1 + nominal) / (1 + inflation) - 1
        const realNetReturn = ((1 + afterTaxNominal) / (1 + inflation / 100)) - 1;

        return realNetReturn * 100; // Return as percentage
    },

    getDetailedProjection(assets, incomes, settings) {
        const startAge = parseFloat(settings.currentAge);
        const retireAge = parseFloat(settings.retirementAge);
        const pensionAge = parseFloat(settings.pensionAge);
        const endAge = 100;

        let currentAssets = this.getTotalAssets(assets);
        const monthlyIncome = this.getTotalMonthlyIncome(incomes);

        // Use the new Real Net Return calculation
        const realReturnRate = this.getRealNetReturn(
            parseFloat(settings.investmentReturnRate),
            parseFloat(settings.inflationRate),
            parseFloat(settings.capitalGainsTax || 27.5)
        ) / 100;

        const projection = [];

        for (let age = startAge; age <= endAge; age++) {
            const isRetired = age >= retireAge;
            const isPension = age >= pensionAge;

            let yearlyIncome = monthlyIncome * 12;
            if (isPension) {
                yearlyIncome += parseFloat(settings.expectedPension) * 14; // 14 payments in Austria
            }

            // Withdrawals
            let withdrawal = 0;
            if (isRetired) {
                // Re-use Gap Budget logic to determine "Desired Annual Spend"
                const gapBudget = this.getGapBudget(assets, incomes, settings);

                // Need = GapBudget - Income.
                let monthlyNeed = gapBudget;
                let monthlyFromAssets = monthlyNeed - (yearlyIncome / 12);

                if (monthlyFromAssets < 0) monthlyFromAssets = 0;

                withdrawal = monthlyFromAssets * 12;
            }

            const startBalance = currentAssets;
            const growth = startBalance * realReturnRate;
            const endBalance = startBalance + growth - withdrawal;

            projection.push({
                age,
                startBalance,
                growth,
                withdrawal,
                income: yearlyIncome,
                endBalance
            });

            currentAssets = endBalance;
            if (currentAssets < 0) currentAssets = 0;
        }

        return projection;
    }
};
