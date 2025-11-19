const STORAGE_KEY = 'retirement_dashboard_data';

const defaultData = {
    assets: [], // { id, name, value, type: 'cash' | 'stock' | 'real_estate' }
    incomes: [], // { id, name, value }
    settings: {
        currentAge: 35,
        retirementAge: 55,
        pensionAge: 65,
        expectedPension: 2000,
        safeWithdrawalRate: 3.5,
        investmentReturnRate: 5.0,
        inflationRate: 2.5,
        language: 'de'
    }
};

export const store = {
    data: loadData(),

    save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        window.dispatchEvent(new CustomEvent('store-updated'));
    },

    addAsset(asset) {
        this.data.assets.push({ ...asset, id: crypto.randomUUID() });
        this.save();
    },

    removeAsset(id) {
        this.data.assets = this.data.assets.filter(a => a.id !== id);
        this.save();
    },

    addIncome(income) {
        this.data.incomes.push({ ...income, id: crypto.randomUUID() });
        this.save();
    },

    removeIncome(id) {
        this.data.incomes = this.data.incomes.filter(i => i.id !== id);
        this.save();
    },

    updateSettings(newSettings) {
        this.data.settings = { ...this.data.settings, ...newSettings };
        this.save();
    },

    reset() {
        this.data = JSON.parse(JSON.stringify(defaultData));
        this.save();
    }
};

function loadData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return JSON.parse(JSON.stringify(defaultData));

    const parsed = JSON.parse(stored);
    // Deep merge settings to ensure new keys (like investmentReturnRate) are present
    return {
        ...defaultData,
        ...parsed,
        settings: {
            ...defaultData.settings,
            ...(parsed.settings || {})
        }
    };
}
