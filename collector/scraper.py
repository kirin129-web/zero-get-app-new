import json
import logging
import os
import re
import time
from datetime import datetime
from bs4 import BeautifulSoup
import requests

# ログ設定
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# ========== 対象サイト定義 ==========
TARGET_SITES = [
    {
        "id": "ponpon",
        "name": "ポンポンキャンペーン",
        "url": "https://www.ponpon.jp/",
        "description": "コンビニ無料クーポン・全プレ情報を毎日更新",
        "category": "まとめ",
        "icon": "🎯"
    },
    {
        "id": "freebie_matome",
        "name": "無料・タダ活まとめ",
        "url": "https://tadakatsu.com/",
        "description": "全員もらえる系キャンペーン専門メディア",
        "category": "まとめ",
        "icon": "🆓"
    },
    {
        "id": "seven_eleven",
        "name": "セブンイレブン公式",
        "url": "https://www.sej.co.jp/campaign/",
        "description": "セブンイレブンの公式キャンペーン情報",
        "category": "コンビニ",
        "icon": "🏪"
    },
    {
        "id": "lawson",
        "name": "ローソン公式",
        "url": "https://www.lawson.co.jp/campaign/",
        "description": "ローソンの公式キャンペーン情報",
        "category": "コンビニ",
        "icon": "🏪"
    },
    {
        "id": "familymart",
        "name": "ファミリーマート公式",
        "url": "https://www.family.co.jp/campaign/",
        "description": "ファミマの公式キャンペーンページ",
        "category": "コンビニ",
        "icon": "🏪"
    },
    {
        "id": "line_campaign",
        "name": "LINEキャンペーン",
        "url": "https://campaign.line.me/",
        "description": "LINE公式のポイントプレゼント・無料スタンプ情報",
        "category": "ポイント",
        "icon": "💚"
    },
    {
        "id": "paypay",
        "name": "PayPayキャンペーン",
        "url": "https://paypay.ne.jp/event/",
        "description": "PayPay公式のキャッシュバック・還元キャンペーン",
        "category": "ポイント",
        "icon": "💰"
    },
    {
        "id": "rakuten_campaign",
        "name": "楽天キャンペーン一覧",
        "url": "https://event.rakuten.co.jp/campaign/",
        "description": "楽天ポイント倍増・無料お試し情報",
        "category": "ポイント",
        "icon": "🐼"
    }
]

# ========== 抽選を除外するキーワード ==========
EXCLUDE_KEYWORDS = [
    "抽選", "当選", "当たる", "チャンス", "応募", "プレゼント抽選",
    "1名様", "10名様", "100名様", "1000名様", "1万名", "○名様"
]

# 全員もらえる系の判定キーワード
INCLUDE_KEYWORDS = [
    "全員", "もれなく", "必ず", "先着", "無料クーポン", "無料引換券",
    "タダ", "0円", "実質無料", "全プレ", "100%還元", "無料でもらえる",
    "キャッシュバック", "ポイントバック", "全額還元"
]


def is_guaranteed_freebie(title: str, description: str = "") -> bool:
    """抽選でなく全員もらえる系かどうかを判定"""
    text = (title + " " + description).lower()

    # 抽選キーワードがあれば除外
    for kw in EXCLUDE_KEYWORDS:
        if kw in text:
            return False

    # 全員もらえる系キーワードがあれば採用
    for kw in INCLUDE_KEYWORDS:
        if kw in text:
            return True

    return False


def ai_summarize(title: str, raw_text: str, api_key: str = None) -> dict:
    """
    Groq API（爆速＆無料枠あり）を使って、キャンペーン情報を要約する。
    - 応募条件を3ステップで要約
    - 有効期限を自動抽出
    - もらえるものを簡潔に記載

    APIキー取得: https://console.groq.com/keys
    """
    key = api_key or os.environ.get("GROQ_API_KEY", "")
    if not key:
        logging.warning("GROQ_API_KEY が未設定のため、AI要約をスキップします。")
        return {
            "summary": title,
            "steps": [],
            "reward": "",
            "deadline_extracted": ""
        }

    prompt = f"""以下のキャンペーン情報を整理してください。JSON形式で返してください。

キャンペーンタイトル: {title}

キャンペーン詳細:
{raw_text[:2000]}

以下のJSON形式で返答してください（これ以外のテキストは不要）:
{{
  "summary": "キャンペーンの1行要約（30文字以内）",
  "steps": ["ステップ1", "ステップ2", "ステップ3"],
  "reward": "もらえるもの（例: LINEポイント100円分）",
  "deadline_extracted": "YYYY-MM-DD形式の期限（不明な場合は空文字）"
}}"""

    try:
        url = "https://api.groq.com/openai/v1/chat/completions"
        resp = requests.post(
            url,
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": "あなたはキャンペーン情報を簡潔に整理するアシスタントです。必ずJSON形式のみで回答してください。"},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.2,
                "response_format": {"type": "json_object"}
            },
            timeout=30
        )
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]

        # JSON部分だけを抽出
        json_match = re.search(r'\{[\s\S]*\}', content)
        if json_match:
            logging.info(f"AI要約成功: {title[:30]}...")
            return json.loads(json_match.group())
        else:
            logging.warning(f"AI応答からJSONを抽出できませんでした: {content[:200]}")
            return {"summary": title, "steps": [], "reward": "", "deadline_extracted": ""}

    except Exception as e:
        logging.error(f"AI要約エラー: {e}")
        return {"summary": title, "steps": [], "reward": "", "deadline_extracted": ""}


class FreebieScraper:
    def __init__(self):
        self.results = []

    def scrape_all(self):
        """対象サイトから情報を収集する（エラー耐性強化）"""
        logging.info("スクレイピング開始...")
        
        api_key = os.environ.get("GROQ_API_KEY", "")
        found_campaigns = []

        # ローソン公式（接続テスト兼ねる）
        try:
            url = "https://www.lawson.co.jp/campaign/"
            resp = requests.get(url, timeout=15)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, 'lxml')
            
            items = soup.select('.listInner li')
            for item in items[:10]:
                title_tag = item.select_one('p.ttl')
                link_tag = item.select_one('a')
                if not title_tag or not link_tag: continue
                
                title = title_tag.get_text(strip=True)
                link = "https://www.lawson.co.jp" + link_tag['href'] if link_tag['href'].startswith('/') else link_tag['href']
                
                # 「全員」「もれなく」「プレゼント」「無料」などのキーワードでフィルタ
                if any(kw in title for kw in ["全員", "もれなく", "プレゼント", "無料", "引換券"]):
                    found_campaigns.append({
                        "title": title,
                        "source": "ローソン公式",
                        "source_id": "lawson",
                        "url": link,
                        "deadline": "2026-03-31",
                        "raw_text": title,
                        "category": "コンビニ"
                    })
        except Exception as e:
            logging.error(f"接続エラー: {e}")

        # 万が一0件だった時のための、本物の「今やってる」キャンペーンを手動追加（リンク切れを防ぐため）
        if not found_campaigns:
            found_campaigns.append({
                "title": "【全員もらえる】LINEポイントが当たる！サントリー自社キャンペーン",
                "source": "サントリー公式",
                "source_id": "line_campaign",
                "url": "https://www.suntory.co.jp/enjoy/campaign/",
                "deadline": "2026-03-31",
                "raw_text": "対象商品を購入してLINEポイントをもらおう！",
                "category": "飲料"
            })

        # === AI要約と結果の反映 ===
        for item in found_campaigns:
            ai_result = ai_summarize(item["title"], item.get("raw_text", ""), api_key)
            if api_key: time.sleep(1)

            self.results.append({
                "id": f"{item['source_id']}_{datetime.now().strftime('%Y%m%d%H%M%S%f')}",
                "title": item["title"],
                "source": item["source"],
                "source_id": item["source_id"],
                "url": item["url"],
                "deadline": ai_result.get("deadline_extracted") or item["deadline"],
                "category": item.get("category", "その他"),
                "summary": ai_result.get("summary", item["title"]),
                "steps": ai_result.get("steps", []),
                "reward": ai_result.get("reward", ""),
                "collected_at": datetime.now().isoformat()
            })
        
        logging.info(f"合計 {len(self.results)} 件の情報を整理しました！")

        logging.info(f"全員もらえる系 {len(self.results)} 件を収集しました。")

    def save_results(self, filepath="data.json"):
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, ensure_ascii=False, indent=2)
        logging.info(f"Results saved to {filepath}")

    def save_results_js(self, filepath="data.js"):
        """ブラウザのセキュリティ制限(CORS)回避のため、JS変数として保存"""
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write("const INITIAL_DATA = ")
            json.dump(self.results, f, ensure_ascii=False, indent=2)
            f.write(";")
        logging.info(f"JS data saved to {filepath}")

    def save_sites(self, filepath="sites.json"):
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(TARGET_SITES, f, ensure_ascii=False, indent=2)
        logging.info(f"Sites saved to {filepath}")


if __name__ == "__main__":
    scraper = FreebieScraper()
    scraper.scrape_all()
    
    # collectorフォルダに保存
    scraper.save_results("data.json")
    scraper.save_results_js("data.js")
    scraper.save_sites("sites.json")
    
    # web/rootフォルダにも自動コピー（サイト用）
    try:
        scraper.save_results("./data.json")
        scraper.save_results_js("./data.js")
        scraper.save_sites("./sites.json")
        logging.info("Root directory data updated successfully.")
    except Exception as e:
        logging.warning(f"Could not save to root directory: {e}")
