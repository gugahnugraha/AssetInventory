import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Define styles exactly matching the 92x38mm dimensions and 7x2 grid layout
const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: '10mm',
    paddingLeft: '11mm',
    paddingRight: '9mm',
    paddingBottom: '10mm',
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

// Helper to format Merk/Type text to fit nicely on the sticker
const formatMerkType = (merkType?: string | null): string => {
  if (!merkType) return "-";
  const cleaned = merkType.trim();
  if (!cleaned || cleaned === "-") return "-";

  // If it's short enough, use it as is
  if (cleaned.length <= 22) {
    return cleaned;
  }

  // If it has a slash, split and get the brand (merk)
  if (cleaned.includes("/")) {
    const brand = cleaned.split("/")[0].trim();
    if (brand && brand.length <= 22) {
      return brand;
    }
    // If brand is still too long, truncate it
    return brand.substring(0, 19) + "...";
  }

  // Otherwise truncate the whole string
  return cleaned.substring(0, 19) + "...";
};

interface AssetStickerDocumentProps {
  assets: any[];
  qrCodes: Record<string, string>;
  logoUrl: string;
}

export const AssetStickerDocument = ({ assets, qrCodes, logoUrl }: AssetStickerDocumentProps) => {
  // Urutkan aset berdasarkan kode aset (classCode) dan nomor register secara ascending
  const sortedAssets = [...assets].sort((a, b) => {
    const partsA = (a.kodeLengkap || "").split(".");
    const noRegAStr = partsA.pop() || "";
    const classCodeA = partsA.join(".");

    const partsB = (b.kodeLengkap || "").split(".");
    const noRegBStr = partsB.pop() || "";
    const classCodeB = partsB.join(".");

    // 1. Bandingkan kode aset (classCode)
    const compCode = classCodeA.localeCompare(classCodeB, undefined, { numeric: true, sensitivity: 'base' });
    if (compCode !== 0) return compCode;

    // 2. Bandingkan nomor register secara numerik
    const regA = Number(noRegAStr) || a.nomorRegister || 0;
    const regB = Number(noRegBStr) || b.nomorRegister || 0;
    return regA - regB;
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {sortedAssets.map((asset, index) => {
          const parts = (asset.kodeLengkap || "").split(".");
          const noReg = parts.pop() || "-";
          const classCode = parts.join(".") || "-";
          const opdKode = asset.opd?.kodeNumeric || "-";
          const opdNama = asset.opd?.kode || "-";
          const namaAset = asset.namaAset || "-";
          const tahunBeli = asset.tahunPembelian || "-";
          const qrDataUrl = qrCodes[asset.id];

          return (
            <View key={`${asset.id}-${index}`} style={styles.sticker} wrap={false}>
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
            </View>
          );
        })}
      </Page>
    </Document>
  );
};
