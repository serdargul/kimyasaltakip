# Kimyasal Fiyat Takip (Chemical Price Tracker)

GuideChem üzerinden kimyasal ürünlerin piyasa fiyatlarını (CNY bazlı) takip eden ve anlık döviz kurları (USD / EUR) ile TON bazında hesaplayan statik dashboard.

## 🚀 Mimari Özellikleri
- **Sunucusuz (Serverless / Jamstack):** Herhangi bir backend sunucusu gerektirmez.
- **Otomatik Fiyat Güncelleme:** GitHub Actions her sabah otomatik çalışarak döviz kurlarını ve GuideChem fiyatlarını günceller.
- **Sıfır Maliyet & Kesintisiz:** GitHub Pages üzerinde %100 ücretsiz barındırılır, CORS sorunu yaşanmaz.

## 🛠️ Yerel Geliştirme (Local Development)

```bash
# Bağımlılıkları yükleyin
cd Frontend
npm install

# Fiyatları ve kurları yerelde güncellemek için
npm run sync

# Geliştirme sunucusunu başlatın
npm run dev
```

## 🌐 GitHub'da Canlıya Alma (GitHub Pages)

1. Projeyi GitHub'da yeni bir depoya (repository) pushlayın:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit for github pages"
   git branch -M main
   git remote add origin https://github.com/KULLANICI_ADINIZ/REPO_ADINIZ.git
   git push -u origin main
   ```

2. GitHub deponuzun ayarlarından GitHub Pages'i aktif edin:
   - Depo sayfasında **Settings** -> **Pages** sekmesine gidin.
   - **Build and deployment** başlığı altındaki **Source** seçeneğini `Deploy from a branch` yerine **`GitHub Actions`** olarak seçin.

3. Tebrikler! `.github/workflows/deploy.yml` dosyanız otomatik devreye girecek, fiyatları güncelleyecek ve sitenizi anında canlıya alacaktır.
