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

    // Detailed projection for the table
    getDetailedProjection(assets, incomes, settings) {
        const currentAge = parseFloat(settings.currentAge);
        const retirementAge = parseFloat(settings.retirementAge);
        const pensionAge = parseFloat(settings.pensionAge);
        const totalAssets = this.getTotalAssets(assets);
        const monthlyRental = this.getTotalMonthlyIncome(incomes);
        const monthlyPension = parseFloat(settings.expectedPension) || 0;
        const swr = parseFloat(settings.safeWithdrawalRate) / 100;
        const returnRate = parseFloat(settings.investmentReturnRate) / 100;

        // Annual withdrawal amount based on SWR at start of retirement (simplified to current assets for now)
        // In a real scenario, this would be fixed at the start of retirement + inflation.
        // Here we treat it as a fixed real amount derived from the current asset value.
        const annualWithdrawalTarget = totalAssets * swr;

        let currentNetWorth = totalAssets;
        const dataPoints = [];

        for (let age = currentAge; age <= 100; age++) {
            let annualWithdrawal = 0;
            let annualIncome = monthlyRental * 12;

            // Logic:
            // 1. If retired, we withdraw.
            // 2. If pension age reached, we get pension.

            if (age >= retirementAge) {
                annualWithdrawal = annualWithdrawalTarget;
            }

            if (age >= pensionAge) {
                annualIncome += (monthlyPension * 12);
            }

            // Growth happens on the balance BEFORE withdrawal (or after? usually mid-year or start. Let's say start balance grows, then we withdraw)
            // Standard: End = Start * (1+r) - Withdrawal
            // But if we withdraw monthly, it's roughly: End = Start + (Start * r) - Withdrawal

            const growth = currentNetWorth * returnRate;
            const endNetWorth = currentNetWorth + growth - annualWithdrawal + (age < retirementAge ? 0 : 0); // Adding savings if working? 
            // Simplified: We only track depletion/growth of CURRENT assets. We don't model new savings from salary before retirement here.

            dataPoints.push({
                age,
                startBalance: currentNetWorth,
                withdrawal: annualWithdrawal,
                income: annualIncome,
                growth: growth,
                endBalance: endNetWorth
            });

            currentNetWorth = endNetWorth;

            // Stop if broke
            if (currentNetWorth < 0) currentNetWorth = 0;
        }
        return dataPoints;
    }
};
