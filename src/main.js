import './style.css'
import { store } from './store.js'
import { calculator } from './calculator.js'
import { translations } from './i18n.js'

const app = document.querySelector('#app');

function Tooltip(text) {
  return `
    <div class="group relative inline-block ml-1 align-middle">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-slate-400 hover:text-primary cursor-help">
        <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
      <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none">
        ${text}
        <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  `;
}

function render() {
  const { assets, incomes, settings } = store.data;
  const lang = settings.language || 'de'; // Default to 'de' if undefined, though store has default
  const t = (key) => translations[lang][key] || key;

  const totalAssets = calculator.getTotalAssets(assets);
  const monthlyRental = calculator.getTotalMonthlyIncome(incomes);
  const gapBudget = calculator.getGapBudget(assets, incomes, settings);
  const pensionBudget = calculator.getPensionPhaseBudget(assets, incomes, settings);
  const projection = calculator.getDetailedProjection(assets, incomes, settings);

  app.innerHTML = `
    <div class="max-w-5xl mx-auto p-6 space-y-8">
      <!-- Header -->
      <header class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-primary">${t('title')}</h1>
          <p class="text-slate-500">${t('subtitle')}</p>
        </div>
        <div class="flex items-center gap-4">
          <button onclick="toggleLanguage()" class="text-sm font-medium text-slate-600 hover:text-primary bg-slate-100 px-3 py-1 rounded-full transition-colors">
            ${lang === 'en' ? '🇦🇹 DE' : '🇺🇸 EN'}
          </button>
          <button id="reset-btn" class="text-sm text-slate-400 hover:text-danger">${t('resetData')}</button>
        </div>
      </header>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="card bg-gradient-to-br from-slate-800 to-slate-900 text-white border-none">
          <h3 class="text-slate-400 text-sm font-medium uppercase tracking-wider">${t('netWorth')}</h3>
          <div class="mt-2 text-3xl font-bold">€${formatCurrency(totalAssets)}</div>
          <p class="text-slate-400 text-sm mt-1">+ €${formatCurrency(monthlyRental)}/mo ${t('monthlyIncome')}</p>
        </div>
        
        <div class="card border-accent/20 bg-accent/5">
          <div class="flex justify-between items-start">
            <h3 class="text-slate-600 text-sm font-medium uppercase tracking-wider">${t('earlyRetirement')}</h3>
            <span class="bg-accent/10 text-accent text-xs px-2 py-1 rounded-full font-bold">${t('age')} ${settings.retirementAge}-${settings.pensionAge}</span>
          </div>
          <div class="mt-2 text-3xl font-bold text-primary">€${formatCurrency(gapBudget)}<span class="text-lg text-slate-500 font-normal">/mo</span></div>
          <p class="text-slate-500 text-sm mt-1">${t('safeWithdrawal')} + ${t('monthlyIncome')}</p>
        </div>

        <div class="card border-success/20 bg-success/5">
          <div class="flex justify-between items-start">
             <h3 class="text-slate-600 text-sm font-medium uppercase tracking-wider">${t('pensionPhase')}</h3>
             <span class="bg-success/10 text-success text-xs px-2 py-1 rounded-full font-bold">${t('age')} ${settings.pensionAge}+</span>
          </div>
          <div class="mt-2 text-3xl font-bold text-primary">€${formatCurrency(pensionBudget)}<span class="text-lg text-slate-500 font-normal">/mo</span></div>
          <p class="text-slate-500 text-sm mt-1">${t('includesPension')}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column: Inputs -->
        <div class="lg:col-span-2 space-y-8">
          
          <!-- Assets Section -->
          <section class="card">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-bold text-primary">${t('assets')}</h2>
              <button id="add-asset-btn" class="btn-primary text-sm">${t('addAsset')}</button>
            </div>
            <div class="space-y-3" id="assets-list">
              ${assets.length === 0 ? `<p class="text-slate-400 text-center py-4">${t('noAssets')}</p>` : ''}
              ${assets.map(asset => `
                <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg group">
                  <select class="bg-transparent border-none text-slate-500 text-sm focus:ring-0 cursor-pointer" onchange="updateAssetType('${asset.id}', this.value)">
                    <option value="cash" ${asset.type === 'cash' ? 'selected' : ''}>${t('cash')}</option>
                    <option value="stock" ${asset.type === 'stock' ? 'selected' : ''}>${t('stock')}</option>
                    <option value="real_estate" ${asset.type === 'real_estate' ? 'selected' : ''}>${t('realEstate')}</option>
                  </select>
                  <input type="text" value="${asset.name}" placeholder="${t('assetName')}" 
                    class="flex-1 bg-transparent border-none focus:ring-0 font-medium text-slate-700 placeholder-slate-400"
                    onchange="updateAssetName('${asset.id}', this.value)">
                  <div class="flex items-center gap-1">
                    <span class="text-slate-400">€</span>
                    <input type="number" value="${asset.value}" placeholder="0" 
                      class="w-28 bg-transparent border-none focus:ring-0 text-right font-bold text-slate-900"
                      onchange="updateAssetValue('${asset.id}', this.value)">
                  </div>
                  <button onclick="removeAsset('${asset.id}')" class="opacity-0 group-hover:opacity-100 btn-danger transition-opacity">×</button>
                </div>
              `).join('')}
            </div>
          </section>

          <!-- Income Section -->
          <section class="card">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-bold text-primary">${t('monthlyIncome')}</h2>
              <button id="add-income-btn" class="btn-secondary text-sm">${t('addIncome')}</button>
            </div>
            <div class="space-y-3" id="incomes-list">
               ${incomes.length === 0 ? `<p class="text-slate-400 text-center py-4">${t('noIncome')}</p>` : ''}
               ${incomes.map(income => `
                <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg group">
                  <input type="text" value="${income.name}" placeholder="${t('propertyName')}" 
                    class="flex-1 bg-transparent border-none focus:ring-0 font-medium text-slate-700 placeholder-slate-400"
                    onchange="updateIncomeName('${income.id}', this.value)">
                  <div class="flex items-center gap-1">
                    <span class="text-slate-400">€</span>
                    <input type="number" value="${income.value}" placeholder="0" 
                      class="w-28 bg-transparent border-none focus:ring-0 text-right font-bold text-slate-900"
                      onchange="updateIncomeValue('${income.id}', this.value)">
                    <span class="text-slate-400 text-sm">/mo</span>
                  </div>
                  <button onclick="removeIncome('${income.id}')" class="opacity-0 group-hover:opacity-100 btn-danger transition-opacity">×</button>
                </div>
              `).join('')}
            </div>
          </section>
        </div>

        <!-- Right Column: Settings -->
        <div class="space-y-6">
          <section class="card bg-slate-50/50">
            <h2 class="text-lg font-bold text-primary mb-4">${t('planningSettings')}</h2>
            <div class="space-y-4">
              
              <div>
                <label class="block text-sm font-medium text-slate-600 mb-1">${t('currentAge')}</label>
                <input type="number" value="${settings.currentAge}" 
                  class="input-field"
                  onchange="updateSetting('currentAge', this.value)">
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-600 mb-1">${t('retireAt')}</label>
                  <input type="number" value="${settings.retirementAge}" 
                    class="input-field"
                    onchange="updateSetting('retirementAge', this.value)">
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-600 mb-1">${t('pensionAt')}</label>
                  <input type="number" value="${settings.pensionAge}" 
                    class="input-field"
                    onchange="updateSetting('pensionAge', this.value)">
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-600 mb-1">${t('expectedPension')}</label>
                <div class="relative">
                  <span class="absolute left-3 top-2 text-slate-400">€</span>
                  <input type="number" value="${settings.expectedPension}" 
                    class="input-field pl-8"
                    onchange="updateSetting('expectedPension', this.value)">
                </div>
                <p class="text-xs text-slate-400 mt-1">${t('monthlyNet')}</p>
              </div>

              <div>
                 <label class="block text-sm font-medium text-slate-600 mb-1">
                    ${t('swr')}
                    ${Tooltip(t('tooltip_swr'))}
                 </label>
                 <div class="flex items-center gap-2">
                   <input type="range" min="2.0" max="5.0" step="0.1" value="${settings.safeWithdrawalRate}" 
                     class="flex-1 cursor-pointer"
                     oninput="updateSwrDisplay(this.value)"
                     onchange="updateSetting('safeWithdrawalRate', this.value)">
                   <span id="swr-display" class="text-sm font-bold text-primary w-12 text-right">${settings.safeWithdrawalRate}%</span>
                 </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-600 mb-1">
                    ${t('expectedReturn')}
                    ${Tooltip(t('tooltip_return'))}
                </label>
                <div class="flex items-center gap-2">
                   <input type="number" step="0.1" value="${settings.investmentReturnRate}" 
                     class="input-field"
                     onchange="updateSetting('investmentReturnRate', this.value)">
                   <span class="text-slate-500">%</span>
                </div>
                <p class="text-xs text-slate-400 mt-1">${t('realReturn')}</p>
              </div>

            </div>
          </section>
        </div>
      </div>

      <!-- Projection Table -->
      <section class="card overflow-hidden">
        <h2 class="text-xl font-bold text-primary mb-4">${t('projectionTitle')}</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="bg-slate-50 text-slate-500 uppercase font-medium">
              <tr>
                <th class="px-4 py-3">${t('age')}</th>
                <th class="px-4 py-3 text-right">${t('startBalance')}</th>
                <th class="px-4 py-3 text-right">${t('growth')} (+${settings.investmentReturnRate}%)</th>
                <th class="px-4 py-3 text-right">${t('withdrawal')}</th>
                <th class="px-4 py-3 text-right">${t('income')}</th>
                <th class="px-4 py-3 text-right">${t('endBalance')}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${projection.map(row => `
                <tr class="hover:bg-slate-50/50 transition-colors ${row.age === parseFloat(settings.retirementAge) ? 'bg-accent/5' : ''} ${row.age === parseFloat(settings.pensionAge) ? 'bg-success/5' : ''}">
                  <td class="px-4 py-3 font-medium text-slate-700">
                    ${row.age}
                    ${row.age === parseFloat(settings.retirementAge) ? `<span class="ml-2 text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded">${t('retire')}</span>` : ''}
                    ${row.age === parseFloat(settings.pensionAge) ? `<span class="ml-2 text-xs bg-success/10 text-success px-1.5 py-0.5 rounded">${t('pension')}</span>` : ''}
                  </td>
                  <td class="px-4 py-3 text-right text-slate-600">€${formatCurrency(row.startBalance)}</td>
                  <td class="px-4 py-3 text-right text-success">€${formatCurrency(row.growth)}</td>
                  <td class="px-4 py-3 text-right text-danger">€${formatCurrency(row.withdrawal)}</td>
                  <td class="px-4 py-3 text-right text-slate-600">€${formatCurrency(row.income)}</td>
                  <td class="px-4 py-3 text-right font-bold ${row.endBalance > 0 ? 'text-slate-900' : 'text-danger'}">€${formatCurrency(row.endBalance)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `;
}

function formatCurrency(num) {
  return new Intl.NumberFormat('de-AT', { maximumFractionDigits: 0 }).format(num);
}

// Global handlers for inline HTML events
window.updateAssetType = (id, val) => {
  const asset = store.data.assets.find(a => a.id === id);
  if (asset) { asset.type = val; store.save(); }
};
window.updateAssetName = (id, val) => {
  const asset = store.data.assets.find(a => a.id === id);
  if (asset) { asset.name = val; store.save(); }
};
window.updateAssetValue = (id, val) => {
  const asset = store.data.assets.find(a => a.id === id);
  if (asset) { asset.value = val; store.save(); }
};
window.removeAsset = (id) => store.removeAsset(id);

window.updateIncomeName = (id, val) => {
  const item = store.data.incomes.find(i => i.id === id);
  if (item) { item.name = val; store.save(); }
};
window.updateIncomeValue = (id, val) => {
  const item = store.data.incomes.find(i => i.id === id);
  if (item) { item.value = val; store.save(); }
};
window.removeIncome = (id) => store.removeIncome(id);

window.updateSwrDisplay = (val) => {
  document.getElementById('swr-display').innerText = val + '%';
};

window.updateSetting = (key, val) => {
  store.updateSettings({ [key]: val });
};

window.toggleLanguage = () => {
  const current = store.data.settings.language || 'de'; // Default to 'de'
  const next = current === 'en' ? 'de' : 'en';
  store.updateSettings({ language: next });
};


// Initial Setup
document.addEventListener('DOMContentLoaded', () => {
  render();

  // Listen for store updates to re-render
  window.addEventListener('store-updated', render);

  // Static button listeners (delegated or attached to body if they exist)
  document.body.addEventListener('click', (e) => {
    if (e.target.id === 'add-asset-btn') {
      store.addAsset({ name: '', value: 0, type: 'cash' });
    }
    if (e.target.id === 'add-income-btn') {
      store.addIncome({ name: '', value: 0 });
    }
    if (e.target.id === 'reset-btn') {
      const lang = store.data.settings.language || 'de';
      const msg = translations[lang].confirmReset;
      if (confirm(msg)) {
        store.reset();
      }
    }
  });
});
