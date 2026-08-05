<!--
CARDO REI methodology applied to this document.
Reference: [CARDO REI Methodology](PROMPTHOUND-DOCS/CARDO-REI.md)
-->

# Marchant Family Archive

A private living archive for family records, source-linked review, and evidence-tiered genealogy.

The app is a Next.js archive browser with separate cards, timelines, previews, and confidence labels so confirmed records stay distinct from family memory and items still under review.

## Live site

<https://family-archive-rose.vercel.app>

## Local development

```bash
npm install
npm run dev
```

## Notes

- This archive is intended for private family research and metadata-first record keeping.
- Document records include inline source scans and visible source citations on the private record pages and preview cards.
- Confidence labels separate confirmed records from family memory and items that still need proof.
- Current work stays cards-first on the ancestors page, with deterministic canonical timeline output, explicit relationship IDs, unresolved conflict tagging, and a visible `NEEDS_REVIEW` queue.
- Changes should be verified with tests before shipping.
