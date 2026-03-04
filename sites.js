// ========== 対象サイト一覧データ ==========
const sitesData = [
    {
        id: "seven_eleven",
        name: "セブンイレブン公式",
        url: "https://www.sej.co.jp/cmp/",
        description: "セブンイレブンのセール・キャンペーン情報",
        category: "コンビニ",
        icon: "🏪",
        status: "active"
    },
    {
        id: "lawson",
        name: "ローソン公式",
        url: "https://www.lawson.co.jp/campaign/",
        description: "ローソンの公式キャンペーン情報",
        category: "コンビニ",
        icon: "🏪",
        status: "active"
    },
    {
        id: "familymart",
        name: "ファミリーマート公式",
        url: "https://www.family.co.jp/campaign/",
        description: "ファミマの公式キャンペーンページ",
        category: "コンビニ",
        icon: "🏪",
        status: "active"
    },
    {
        id: "line_campaign",
        name: "LINEポイントクラブ",
        url: "https://member.line.me/pointclub/",
        description: "LINEポイントが貯まるキャンペーン・ミッション情報",
        category: "ポイント",
        icon: "💚",
        status: "active"
    },
    {
        id: "paypay",
        name: "PayPayキャンペーン",
        url: "https://paypay.ne.jp/event/",
        description: "PayPay公式のキャッシュバック・還元キャンペーン",
        category: "ポイント",
        icon: "💰",
        status: "active"
    },
    {
        id: "rakuten_campaign",
        name: "楽天ポイントカード キャンペーン",
        url: "https://pointcard.rakuten.co.jp/campaign/",
        description: "楽天ポイントカードのお得なキャンペーン一覧",
        category: "ポイント",
        icon: "🐼",
        status: "active"
    }
];

// ========== サイトカード描画 ==========
function renderSites(data) {
    const grid = document.getElementById('sites-grid');
    grid.innerHTML = '';

    if (data.length === 0) {
        grid.innerHTML = '<div class="empty-state"><p>該当するサイトがありません</p></div>';
        return;
    }

    data.forEach((site, index) => {
        const card = document.createElement('a');
        card.className = 'site-card';
        card.href = site.url;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
        card.style.animationDelay = `${index * 0.08}s`;

        card.innerHTML = `
            <div class="site-card-header">
                <span class="site-icon">${site.icon}</span>
                <span class="site-status ${site.status}">${site.status === 'active' ? '監視中' : '停止中'}</span>
            </div>
            <h3 class="site-name">${site.name}</h3>
            <p class="site-desc">${site.description}</p>
            <div class="site-footer">
                <span class="site-category-tag">${site.category}</span>
                <span class="site-link-icon">→</span>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ========== フィルタリング ==========
document.addEventListener('DOMContentLoaded', () => {
    renderSites(sitesData);

    document.querySelectorAll('#site-filter-bar .filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('#site-filter-bar .filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const filter = e.target.dataset.filter;
            if (filter === 'all') {
                renderSites(sitesData);
            } else {
                renderSites(sitesData.filter(s => s.category === filter));
            }
        });
    });
});
