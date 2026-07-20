import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// A4: 297mm tall. Usable = 297 - 10 - 10 = 277mm
// Each sticker: 29mm height + 2mm marginBottom = 31mm per row
// Two columns: 92mm + 2mm margin + 92mm = 186mm (fits within 210 - 11 - 9 = 190mm)
// Rows per page: floor(277 / 31) = 8 rows → 8 × 2 = 16 stickers per page
const ITEMS_PER_PAGE = 16;

const styles = StyleSheet.create({
  page: {
    paddingTop: '10mm',
    paddingLeft: '11mm',
    paddingRight: '9mm',
    paddingBottom: '10mm',
  },
  grid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
  },
  sticker: {
    width: '92mm',
    height: '29mm',
    borderWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',
    display: 'flex',
    flexDirection: 'column',
    marginRight: '2mm',
    marginBottom: '2mm',
    position: 'relative',
  },
  watermarkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  watermarkText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 26,
    color: '#ef4444',
    opacity: 0.32,
    transform: 'rotate(-15deg)',
    textTransform: 'uppercase',
  },
  header: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 6.5,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
    paddingVertical: '1.8mm',
    paddingHorizontal: '2mm',
    textTransform: 'uppercase',
  },
  body: {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: '2mm',
    paddingVertical: '1.2mm',
  },
  logoBox: {
    width: '22mm',
    height: '18mm',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    objectFit: 'contain',
    width: '100%',
    height: '100%',
  },
  detailsBox: {
    flex: 1,
    paddingLeft: '2mm',
    paddingRight: '1mm',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: '0.5mm',
  },
  label: {
    width: '14mm',
    fontFamily: 'Helvetica-Bold',
    fontSize: 6.5,
  },
  colon: {
    width: '2.5mm',
    fontFamily: 'Helvetica-Bold',
    fontSize: 6.5,
    textAlign: 'center',
  },
  value: {
    flex: 1,
    fontFamily: 'Helvetica-Bold',
    fontSize: 6.5,
  },
  qrBox: {
    width: '16mm',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  regText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 5.5,
    textAlign: 'center',
    marginBottom: '1mm',
  },
  qrCode: {
    width: '14mm',
    height: '14mm',
    objectFit: 'contain',
  }
});

const formatMerkType = (merkType?: string | null): string => {
  if (!merkType) return "-";
  return merkType.trim() || "-";
};

interface AssetStickerDocumentProps {
  assets: any[];
  qrCodes: Record<string, string>;
  logoUrl: string;
  isDemo?: boolean;
}

export const AssetStickerDocument = ({ assets, qrCodes, logoUrl, isDemo }: AssetStickerDocumentProps) => {
  // Sort assets by kode aset then nomor register ascending
  const sortedAssets = [...assets].sort((a, b) => {
    const partsA = (a.kodeLengkap || "").split(".");
    const noRegAStr = partsA.pop() || "";
    const classCodeA = partsA.join(".");

    const partsB = (b.kodeLengkap || "").split(".");
    const noRegBStr = partsB.pop() || "";
    const classCodeB = partsB.join(".");

    const compCode = classCodeA.localeCompare(classCodeB, undefined, { numeric: true, sensitivity: 'base' });
    if (compCode !== 0) return compCode;

    const regA = Number(noRegAStr) || a.nomorRegister || 0;
    const regB = Number(noRegBStr) || b.nomorRegister || 0;
    return regA - regB;
  });

  // Split into fixed-size pages so no sticker ever "hangs" to the next page
  const pages: any[][] = [];
  for (let i = 0; i < sortedAssets.length; i += ITEMS_PER_PAGE) {
    pages.push(sortedAssets.slice(i, i + ITEMS_PER_PAGE));
  }

  const renderSticker = (asset: any, globalIdx: number) => {
    const parts = (asset.kodeLengkap || "").split(".");
    const noReg = parts.pop() || "-";
    const classCode = parts.join(".") || "-";
    const opdKode = asset.opd?.kodeNumeric || "-";
    const opdNama = asset.opd?.kode || "-";
    const namaAset = asset.namaAset || "-";
    const tahunBeli = asset.tahunPembelian || "-";
    const qrDataUrl = qrCodes[asset.id];

    return (
      <View key={`${asset.id}-${globalIdx}`} style={styles.sticker}>
        <Text style={styles.header}>PEMERINTAH KABUPATEN BANDUNG</Text>
        <View style={styles.body}>
          <View style={styles.logoBox}>
            {logoUrl && <Image src={logoUrl} style={styles.logo} />}
          </View>

          <View style={styles.detailsBox}>
            <View style={styles.row}>
              <Text style={styles.label}>KODE ASET</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>{classCode}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>NAMA ASET</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>{namaAset}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>MERK/TYPE</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>{formatMerkType(asset.merkType)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>TAHUN</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>{tahunBeli}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>KODE SKPD</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>{opdKode}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>NAMA SKPD</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>{opdNama}</Text>
            </View>
          </View>

          <View style={styles.qrBox}>
            <Text style={styles.regText}>REG: {noReg}</Text>
            {qrDataUrl && <Image src={qrDataUrl} style={styles.qrCode} />}
          </View>
        </View>
        {isDemo && (
          <View style={styles.watermarkContainer}>
            <Text style={styles.watermarkText}>DEMO VERSION</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Document>
      {pages.map((pageAssets, pageIdx) => (
        <Page key={`page-${pageIdx}`} size="A4" style={styles.page}>
          <View style={styles.grid}>
            {pageAssets.map((asset, idx) =>
              renderSticker(asset, pageIdx * ITEMS_PER_PAGE + idx)
            )}
          </View>
        </Page>
      ))}
    </Document>
  );
};
