// ========== モックデータ（全員もらえる系のみ）==========
const campaignData = [
    {
        id: "line_campaign_1",
        title: "【全員もらえる】LINEポイント100円分プレゼントキャンペーン",
        source: "サントリー公式",
        source_id: "line_campaign",
        url: "#",
        deadline: "2026-03-31",
        category: "飲料",
        summary: "サントリー商品購入でLINEポイント100円分を全員にプレゼント",
        steps: ["対象商品を購入", "レシートを撮影してアップロード", "LINEポイント100円分をGET"],
        reward: "LINEポイント100円分"
    },
    {
        id: "lawson_1",
        title: "【先着10万名】ローソン オリジナルスイーツ無料引換券",
        source: "ローソン公式",
        source_id: "lawson",
        url: "#",
        deadline: "2026-03-10",
        category: "コンビニ",
        summary: "ローソンアプリでスイーツ1個無料クーポンをゲット",
        steps: ["ローソンアプリを開く", "クーポン画面で取得", "レジでアプリを提示"],
        reward: "オリジナルスイーツ1個"
    },
    {
        id: "familymart_1",
        title: "【全員】ファミペイ 新規登録で200円分クーポン",
        source: "ファミリーマート公式",
        source_id: "familymart",
        url: "#",
        deadline: "2026-04-15",
        category: "コンビニ",
        summary: "ファミペイ新規登録で200円分クーポンがもれなくもらえる",
        steps: ["ファミペイアプリをダウンロード", "新規会員登録を完了", "200円分クーポンが自動付与"],
        reward: "200円分クーポン"
    },
    {
        id: "paypay_1",
        title: "PayPay 対象店舗で最大100%還元キャンペーン",
        source: "PayPay",
        source_id: "paypay",
        url: "#",
        deadline: "2026-03-20",
        category: "ポイント",
        summary: "対象飲食店でPayPay決済すると全額キャッシュバック（上限1000円）",
        steps: ["対象店舗を確認", "PayPayで決済", "最大100%還元（上限1,000円）"],
        reward: "最大1,000円キャッシュバック"
    },
    {
        id: "rakuten_1",
        title: "【もれなく】楽天ポイント500ポイントもらえるキャンペーン",
        source: "楽天",
        source_id: "rakuten_campaign",
        url: "#",
        deadline: "2026-03-25",
        category: "ポイント",
        summary: "楽天カード初回利用で500ポイントもれなくプレゼント",
        steps: ["キャンペーンにエントリー", "楽天カードで1,000円以上利用", "500ポイントが付与"],
        reward: "楽天ポイント500P"
    },
    {
        id: "seven_1",
        title: "セブンイレブン おにぎり1個無料クーポン配布中",
        source: "セブンイレブン公式",
        source_id: "seven_eleven",
        url: "#",
        deadline: "2026-03-08",
        category: "コンビニ",
        summary: "セブンアプリ会員限定でおにぎり1個無料クーポン",
        steps: ["セブンイレブンアプリを開く", "クーポン画面でGET", "レジで提示して無料"],
        reward: "おにぎり1個"
    }
];

// ========== 残り日数の計算 ==========
function getDaysLeft(deadline) {
    const now = new Date();
    const end = new Date(deadline);
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff;
}

function getUrgencyClass(days) {
    if (days <= 3) return 'urgency-critical';
    if (days <= 7) return 'urgency-warning';
    return 'urgency-safe';
}

function getUrgencyLabel(days) {
    if (days < 0) return '終了';
    if (days === 0) return '本日まで！';
    if (days <= 3) return `残り${days}日⚡`;
    if (days <= 7) return `残り${days}日`;
    return `残り${days}日`;
}

// ========== カード描画 ==========
function renderCampaigns(data) {
    const grid = document.getElementById('campaign-grid');
    grid.innerHTML = '';

    if (data.length === 0) {
        grid.innerHTML = '<div class="empty-state"><p>該当するキャンペーンがありません</p></div>';
        return;
    }

    // 期限が近い順にソート
    data.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    data.forEach((item, index) => {
        const daysLeft = getDaysLeft(item.deadline);
        if (daysLeft < 0) return; // 期限切れは表示しない

        const card = document.createElement('div');
        card.className = 'card';
        card.style.animationDelay = `${index * 0.08}s`;

        // ステップのHTML
        const stepsHtml = item.steps && item.steps.length > 0
            ? `<div class="card-steps">
                <p class="steps-label">📋 もらい方：</p>
                <ol class="steps-list">
                    ${item.steps.map(s => `<li>${s}</li>`).join('')}
                </ol>
               </div>`
            : '';

        card.innerHTML = `
            <div class="card-top-row">
                <span class="badge badge-all">全員もらえる</span>
                <span class="deadline-badge ${getUrgencyClass(daysLeft)}">${getUrgencyLabel(daysLeft)}</span>
            </div>
            <h2 class="card-title">${item.title}</h2>
            ${item.summary ? `<p class="card-summary">${item.summary}</p>` : ''}
            ${item.reward ? `<div class="card-reward"><span class="reward-icon">🎁</span> <strong>${item.reward}</strong></div>` : ''}
            ${stepsHtml}
            <div class="card-meta">
                <span>📍 ${item.source}</span>
                <span>📅 〜${item.deadline}</span>
            </div>
            <a href="${item.url}" class="btn-get" target="_blank">今すぐチェック ✨</a>
        `;
        grid.appendChild(card);
    });
}

// ========== 統計バー更新 ==========
function updateStats(data) {
    const total = data.length;
    const ending = data.filter(d => getDaysLeft(d.deadline) <= 3 && getDaysLeft(d.deadline) >= 0).length;
    const now = new Date();
    const updated = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-ending').textContent = ending;
    document.getElementById('stat-updated').textContent = updated;
}

// ========== 初期化 ==========
async function init() {
    // 1. まず data.js から読み込まれたグローバル変数をチェック（ローカル環境用）
    if (typeof INITIAL_DATA !== 'undefined' && INITIAL_DATA.length > 0) {
        console.log('Data loaded from data.js (Local mode)');
        renderCampaigns(INITIAL_DATA);
        updateStats(INITIAL_DATA);
        return;
    }

    // 2. data.js がない場合は サーバー環境(fetch) を試みる
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        console.log('Data loaded from data.json (Server mode)');
        renderCampaigns(data);
        updateStats(data);
    } catch (error) {
        console.warn('Failed to load real data, using mock data instead:', error);
        // 最終手段としてサンプルを表示
        renderCampaigns(campaignData);
        updateStats(campaignData);
    }
}

document.addEventListener('DOMContentLoaded', init);

// ========== フィルタリング ==========
document.querySelectorAll('#filter-bar .filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('#filter-bar .filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        const filter = e.target.dataset.filter;
        if (filter === 'all') {
            renderCampaigns(campaignData);
            updateStats(campaignData);
        } else {
            const filtered = campaignData.filter(item => item.category === filter);
            renderCampaigns(filtered);
            updateStats(filtered);
        }
    });
});
