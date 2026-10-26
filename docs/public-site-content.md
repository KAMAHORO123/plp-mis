# Public site content

The administrator can edit the public announcement under **Website banner** in the sidebar or **Content studio → Website banner**. Title, date, location, destination, link label, visibility, and sample-event status are editable. Past events are hidden. Like existing Hub data, edits persist in localStorage in the same browser; this is not a shared CMS.

The initial 14 November 2026 event is explicitly a sample, not a confirmed PLP event. Replace it before publishing. Testimonials and Kinyarwanda names are generated illustrative content, labelled in the UI, with no implication that pictured album participants supplied them.

## Album sources

Eight optimized JPEGs are stored in both public image trees. All came from the four user-provided Drive collections, inspected using the Google Drive connector. The gallery now serves the imported photos directly with an on-site viewer; no visitor-facing Drive links remain.

| Local asset | Drive file ID | Collection |
| --- | --- | --- |
| academy-1.jpg | 1cWah3L7_YyNZ5FMiPBnYhc1BE6cOqiBO | 1PB1k0QMjdK5Z5SXZT5UFtKr6UQZv3Z5T / PLP Academy 2024 |
| academy-2.jpg | 1yGWWVOo-zBY8wbdc9NIExbdqjwjobPrd | same |
| gathering-1.jpg | 1KCs27NxA6CMENKWJ0kSWxucaBxuBxbOQ | 1LWTQrQGA1Eq_ckC69J18G1JZG7NosUNh |
| gathering-2.jpg | 1N_i6XzNvN6CDl1iQXUZxn0SdmqOzHzVv | same |
| archive-1.jpg | 1mJbx9u8UVttXtAWcwayfxRgWkTRTrKd- | 1HwG5opZs5aYm5RbvD-QjJaTc7Ql008tD |
| archive-2.jpg | 1Y_d3LJKzM2dvhVH7mHtei9X0PTYgUH43 | same |
| camp-1.jpg | 1xAY_fb5LnSBeq12E934jGPx_RVIJe8eI | 1p32lme5od4zDe0TKvGWZvzWIb7NIoiBQ / Day 1 |
| camp-2.jpg | 18Qe2X3fS7CPt4w3HXHaF9h4dE4ed-L_l | same |

## Research and social links (8 October 2026)

- Intore fact: https://ich.unesco.org/en/RL/intore-02129 — UNESCO lists the 2024 inscription. Other fun-corner copy is original, not attributed quotations.
- https://www.linkedin.com/company/peaceandloveproclaimers — directly retrieved and verified as PLP.
- https://www.instagram.com/plpyouth/ — HTTP 200 with profile title Peace and Love Proclaimers.
- https://www.instagram.com/plpyouthca/ — HTTP 200 with profile title PLP Canada. The public profile exposes its avatar (saved as canada-profile.jpg), but no post images. The Canada page now uses the five photos supplied directly by the user, stored under `public/images/plp/canada/` and mirrored in `frontend/public/images/plp/canada/`. They are the original uploaded PNGs, with full-size gallery viewing. Captions describe the visible moments without inventing names or dates.
- https://x.com/plpyouth — account identity corroborated by indexed PLP posts at https://twstalker.com/ColinKazungu ; direct X fetch returns 403, so end-to-end availability could not be confirmed.
- Canada chapter context: https://www.gofundme.com/f/fund-kugicaniro-2026-in-canada and https://www.sproutideas.org/fellows/danny-fidele-kalisa/ . No unconfirmed launch date appears in the new section.

No Facebook account was reliably identified. Do not add guessed social URLs.


## Homepage photo enhancement

The left homepage image uses `public/images/plp/icyeza-home-hd.png`, mirrored in the frontend public folder (1135 × 1386). Enhanced from the user-supplied two-members ICYEZA image using the built-in imagegen tool, not the API/CLI. This is an AI-enhanced derivative; the original existing `public/auth/icyeza.jpg` is retained. Responsive styling keeps the entire frame visible.

Prompt used:

> Use case: identity-preserve. Edit target: supplied photo of two girls holding a PLP ICYEZA frame. Asset: website homepage portrait. Enhance clarity and resolution to HD (at least 1536 pixels tall). Keep original photograph's exact composition, both people's identity, facial features, skin tones, expressions, clothes, hands, background, white frame, logos and all lettering unchanged. Preserve exact text PLP ICYEZA, #rwandacodingacademy, # youth_for_change, # make_a_change, @ plp_rca. Only gently reduce compression blur and improve detail and natural contrast. No beautification, no new objects, no stylization, no rewriting text or changing faces. Keep original portrait aspect ratio.

## Dashboard visual system

`dashboard-theme.css` is shared by the Hub and national dashboard layouts. It applies white cards, subtle blue borders, consistent PLP blue actions, and the code-drawn `images/patterns/imigongo-blue.svg` motif to headers, sidebar branding, and statistic cards. Existing role access and actions remain enforced. Hub certificate and activity trends use the existing browser records, including zero months; approved request totals represent the currently approved subset of each submission month. Resource and activity creation open from their page-header buttons. Reports export the current school/date filters to CSV.

## Canada AI enhancement and public page refresh

The Canada gallery now serves five AI-enhanced derivatives using the built-in imagegen tool. Originals remain alongside them, unchanged. Final assets are in `public/images/plp/canada/` and mirrored in `frontend/public/images/plp/canada/`:

- `community-frame-hd.png`
- `peace-signs-hd.png`
- `welcome-desk-hd.png`
- `on-stage-hd.png`
- `together-hd.png`

Prompt used separately for each original:

> Enhance this exact PLP Canada photograph to crisp HD resolution, approximately 2048 pixels on the long edge. Conservative photographic restoration only: reduce blur and compression, recover natural detail, balance exposure gently. Preserve every person's identity, facial features, expressions, skin tone, pose, clothing, hands, original composition, background and all logos and lettering exactly. Do not add or remove people or objects. Preserve original aspect ratio. No beautification or stylization. Output one enhanced photograph.

The frame image received a follow-up correction using the original and enhanced images:

> Edit first enhanced photo. Fix ONLY the tiny logo text in the upper-left corner of the photo frame to match the original in image 2. It must say 'Peace and Love Proclaimers Canada' next to the original blue bird logo, not Justice or Practitioners. Preserve ALL other pixels/content as closely as possible: people, faces, hands, PLP CANADA title, Follow Us On, @plpyouthca, #PLPCanada, colored social icons, composition, sharpness. Do not invent a tagline. This is a precise small text correction only. Output same size and aspect ratio as image 1.

PLP Pathways and the public Hub page use code-drawn blue imigongo accents. The homepage photo reel has been restored with pause controls, reduced-motion support, and an `/album` link. The peace-and-memory programme poster now uses the walking photo; the homepage right card and impact feature use the arena photo, with updated alt text.

## Expanded album selections
Each collection contains ten distinct supplied photos, hosted locally. Additional Drive sources:
- `academy-3.jpg`: `1C8FzDHGduzcK2A1CnLc807Fe0ql_RC_P` (DSC_6220.jpg)
- `academy-4.jpg`: `1z7j04C-7LEe-enySnmJ6XRRRfN_Wpe3o` (DSC_7705.jpg)
- `academy-5.jpg`: `1dxZcjTVQbCHfe82HKKCqdVQKj6bdRTDM` (DSC_3023.jpg)
- `academy-6.jpg`: `1y_WxjioJH2w0TjpZD0WSl9kysn8ZUgHf` (DSC_7154.jpg)
- `academy-7.jpg`: `12awB5NKSQwIzvSRs8VrDaVjhrB2ZmVBj` (DSC_1101.jpg)
- `academy-8.jpg`: `1Kz1HE3RGF5kuZ4pXbr6bqGRY5O_cFNbe` (DSC_6530.jpg)
- `academy-9.jpg`: `1hfW4CC--6_dVzntalSwTmVhep8NP5mKQ` (DSC_9625.jpg)
- `academy-10.jpg`: `1UBTV3cjeDC0UgEQ9641O_sb4qU_pSicn` (DSC_3258.jpg)
- `gathering-3.jpg`: `1wRlv2c3Ih1A4XI3V6AxtiIUaK30obFW2` (DSC_6798.jpg)
- `gathering-4.jpg`: `1Ncy4rBNBTrefRnno6U2sHXV9xF3ZDtun` (DSC_6873.jpg)
- `gathering-5.jpg`: `1asZis1EhVkbTVShXdkwYg0Y0VkRToDs7` (DSC_6993.jpg)
- `gathering-6.jpg`: `16wBlf0hio6HWoSF7vzEJ7OkJ11tf9JaO` (DSC_7089.jpg)
- `gathering-7.jpg`: `1rn9ldbua0xsXeoA9WQ6cDfQYnd5uW_cl` (DSC_7181.jpg)
- `gathering-8.jpg`: `1Qdwr14LuDHaPW2LH8F0_H4GjCpTXOQ1z` (DSC_6488.jpg)
- `gathering-9.jpg`: `1CNsHtPmka_OSQkZNKjecJ4OSKiodyiJW` (DSC_6565.jpg)
- `gathering-10.jpg`: `1V_n8q8qPSvLP4fVLxNtVH-QlAvY07XuG` (DSC_6645.jpg)
- `archive-3.jpg`: `1Tl_BuO73BULV41ebWbjXxl5M1MbITkTc` (2018_11_10_00_19_IMG_1515.JPG)
- `archive-4.jpg`: `1D-Acv3EPoPTfzOkdoc5C9UYfAZBJ546H` (2018_07_07_19_40_IMG_2687.JPG)
- `archive-5.jpg`: `1thQ-X92a2v9YhdQXNZHgdSFS3y8X4AX8` (2018_10_28_17_17_IMG_0872.JPG)
- `archive-6.jpg`: `1xZER26MvQlaR10IUUoWFWww2IgUL2zOC` (2018_07_10_02_46_IMG_3524.JPG)
- `archive-7.jpg`: `1cU7fe94jR60Ouu5yqFcexP3oyLl92RWm` (2018_11_10_01_40_IMG_1462.JPG)
- `archive-8.jpg`: `1Py0sagmqYAocwVGDZQIrRpxSqYp4LcUz` (48418709_1994974790587726_1619011677691314176_n.jpg)
- `archive-9.jpg`: `1lNYzPc1P7X5Ct-Q9gxz35ntexnwdjMLq` (273182990_4801058239979353_2589235528282827133_n.jpg)
- `archive-10.jpg`: `1BL7uwguI9y56pibm9Y0sPbrU_qhXiI5y` (10842212_776859172399300_8124135944858410488_o.jpg)
- `camp-3.jpg`: `1vO_oz66M8WKPAU6er0IO5avjqRWdDbms` (Copy of DSC_0935.JPG)
- `camp-4.jpg`: `1wEvEqi6Moufa2NAF6ZUMnq9lCkozOoaK` (Copy of DSC_0967.JPG)
- `camp-5.jpg`: `1DCDHb6EXc7nLiG-m22u92egyHaOjOe9F` (Copy of DSC_0995.JPG)
- `camp-6.jpg`: `1otyGgddakSR0FDRKLWxvFo7vimZuAegT` (Copy of DSC_1040.JPG)
- `camp-7.jpg`: `18k5bA5KYUu6tCSmLliiCDSCRCMhDWvMW` (Copy of DSC_1113.JPG)
- `camp-8.jpg`: `1kVsLUw4WYPIpApjaXFBWiu9v5GrELE7q` (Copy of DSC_1183.JPG)
- `camp-9.jpg`: `1G4mkdBgwNAkhxA-_-xiLFqrcI8a4st9J` (Copy of DSC_1233.JPG)
- `camp-10.jpg`: `1rPWz-IVMM7VIFQdy0awpQcuL8PqsZSbf` (Copy of DSC_1282.JPG)

Fun corner trivia sources: UNESCO Intore heritage entry, United Nations International Day of Peace, NOAA largest ocean facts, and US EPA What You Can Do. Quotes are original editorial text, not attributed testimonials.

## Peace and Rwanda learning quiz
The eight-question round now covers respectful dialogue, independence, the 1994 Genocide against the Tutsi, 7 April remembrance, hate-speech prevention, inclusion, and the International Day of Peace. Each explanation links to its UN or UNESCO educational source. Remembrance content uses non-graphic wording and reflective feedback. Earlier general ocean/recycling trivia has been removed.
