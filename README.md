# 🎓 Foster Sınav Sistemi

Öğrenciler için kapsamlı sınav hazırlık uygulaması.

## ✨ Özellikler

- 📝 Çoktan seçmeli sorularla sınav yapma
- 📊 Detaylı istatistik takibi
- 🔥 Günlük çalışma serisi (streak) sistemi
- ❌ Hatalı soruları kaydetme ve tekrar çözme
- 🚨 Soru raporlama sistemi
- 👤 Profil fotoğrafı özelleştirme (hazır avatarlar veya kendi fotoğrafınız)
- ⚙️ Öğrenci ayarları (isim değiştirme, veri sıfırlama)
- 💾 Tüm veriler lokal olarak saklanır

## 📋 Gereksinimler

**Node.js** (v18 veya üzeri) yüklü olmalıdır.

### Node.js Kurulumu

1. [nodejs.org](https://nodejs.org) adresine gidin
2. **LTS** (Long Term Support) sürümünü indirin
3. İndirilen dosyayı çalıştırın
4. Varsayılan ayarlarla kurulumu tamamlayın

## 🚀 Kullanım

### İlk Çalıştırma

1. `start.bat` dosyasına **çift tıklayın**
2. İlk çalıştırmada bağımlılıklar otomatik yüklenecektir (~30 saniye)
3. Uygulama tarayıcınızda otomatik açılacak (<http://localhost:3500>)

### Sonraki Kullanımlar

- Sadece `start.bat`'a çift tıklayın
- Uygulama direkt başlayacak

## 📁 Dosya Yapısı

```
foster/
├── start.bat              # 🎯 BURAYA ÇİFT TIKLAYIN
├── README.md              # Bu dosya
├── server.js              # Backend sunucu
├── dist/                  # Frontend (React)
├── student.json           # Öğrenci verileri
├── sınavlar/              # Sınav soruları
├── public/avatars/        # Profil fotoğrafları
└── node_modules/          # Bağımlılıklar (otomatik)
```

## ⚙️ Ayarlar

Uygulama içinde ⚙️ **Ayarlar** butonuna tıklayarak:

- ✏️ İsminizi değiştirebilirsiniz
- 📸 Profil fotoğrafınızı seçebilirsiniz
- 🗑️ Tüm verilerinizi sıfırlayabilirsiniz

## 💡 İpuçları

- **Sınav seçimi:** Ana sayfada derslere göre sınavları seçin
- **Zamanlayıcı:** Sağ üstteki saat ikonuyla göster/gizle
- **Hızlı geçiş:** Soru seçtikten sonra otomatik geçer
- **Hatalı sorular:** Yanlış sorularınız otomatik kaydedilir
- **Streak:** Günlük çalışarak serinizi artırın 🔥

## 🛑 Uygulamayı Kapatma

Start.bat penceresini kapatın veya `Ctrl+C` basın.

## 📊 Verileriniz

Tüm verileriniz (`student.json`) uygulama klasöründe saklanır:

- ✅ İnternet gerektirmez
- ✅ Gizlilik tam kontrol altında
- ✅ Yedekleme için klasörü kopyalayın

## ❓ Sorun Giderme

### "Node.js bulunamadı" hatası

→ Node.js'i [nodejs.org](https://nodejs.org) adresinden kurun

### Uygulama açılmıyor

→ Port 3500 veya 3501 başka program tarafından kullanılıyor olabilir  
→ Bilgisayarı yeniden başlatıp tekrar deneyin

### Verilerim kayboldu

→ `student.json` dosyası silinmişse template_student.json'dan kopyalayın

## 📧 Destek

Sorunlarınız için:

- GitHub Issues bölümünü kullanın
- README dosyasını dikkatlice okuyun

---

**Not:** Bu uygulama offline çalışır ve hiçbir veri internete gönderilmez. Tüm bilgileriniz bilgisayarınızda kalır.

🎯 **Başarılar dileriz!** 📚
