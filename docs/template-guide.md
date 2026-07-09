# Vakilim.az — Şablon müəllifi üçün bələdçi

Şablon iki hissədən ibarətdir: **sənəd mətni** və **sahələr (JSON)**.
Admin paneldəki *Şablonlar → Yeni şablon* formuna yapışdırılır.

## Sənəd mətni
- Adi mətn; boş sətir = abzas; sətir əvvəlində `# ` = qalın başlıq.
- Müştərinin cavabları `{{sahəAçarı}}` yerdəyişənləri ilə daxil edilir.
- Hazır yerdəyişənlər: `{{TODAY}}` (bugünkü tarix), `{{DOC_UID}}` (sənəd №).
- Mətndəki hər yerdəyişənin sahə siyahısında qarşılığı OLMALIDIR —
  sistem tanımadığı yerdəyişəni qəbul etmir.

## Sahələr (JSON)
Hər sahə bir sual deməkdir — müştəri onları bir-bir cavablandırır.

```json
[
  {
    "key": "applicantName",
    "labelAz": "Adınız, soyadınız",
    "helpAz": "Şəxsiyyət vəsiqəsindəki kimi yazın.",
    "type": "text",
    "required": true
  },
  {
    "key": "amount",
    "labelAz": "Məbləğ (₼)",
    "type": "number",
    "required": true
  },
  {
    "key": "signDate",
    "labelAz": "İmzalanma tarixi",
    "type": "date",
    "required": true
  },
  {
    "key": "court",
    "labelAz": "Məhkəmə",
    "type": "select",
    "required": true,
    "options": [
      { "value": "baki", "labelAz": "Bakı şəhər məhkəməsi" },
      { "value": "sumqayit", "labelAz": "Sumqayıt şəhər məhkəməsi" }
    ]
  },
  {
    "key": "details",
    "labelAz": "Halların təsviri",
    "helpAz": "Tarixləri qeyd etməklə sərbəst yazın.",
    "type": "textarea",
    "required": false
  }
]
```

Qaydalar:
- `key` — latın hərfi ilə başlayır, yalnız hərf/rəqəm (`applicantName`).
- `type` — `text | textarea | date | number | select`.
- `select` üçün `options` mütləqdir.
- `helpAz` — sadə dildə izah; hüquqi termini adi insana çevirin.
- Bir sahə = bir sual. Uzun anket əvəzinə qısa, aydın suallar.

## Versiyalar
Eyni `slug` ilə təkrar göndəriş **yeni versiya** yaradır: yeni sifarişlər
onu alır, köhnə sifarişlər öz versiyasında qalır.
