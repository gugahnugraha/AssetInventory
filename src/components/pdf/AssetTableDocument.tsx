import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    paddingTop: '10mm',
    paddingLeft: '10mm',
    paddingRight: '10mm',
    paddingBottom: '12mm',
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#18181b',
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
    fontSize: 32,
    color: '#ef4444',
    opacity: 0.25,
    transform: 'rotate(-15deg)',
    textTransform: 'uppercase',
  },
  headerBanner: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1.5,
    borderBottomColor: '#059669',
    borderBottomStyle: 'solid',
    paddingBottom: 6,
    marginBottom: 10,
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 28,
    height: 28,
    objectFit: 'contain',
  },
  titleGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  mainTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    color: '#064e3b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subTitle: {
    fontSize: 8,
    color: '#4b5563',
    marginTop: 1,
  },
  headerRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 7.5,
    color: '#6b7280',
  },
  metaBadge: {
    backgroundColor: '#ecfdf5',
    color: '#047857',
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    marginTop: 2,
  },
  table: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#065f46',
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    paddingVertical: 5,
    alignItems: 'center',
  },
  tableRow: {
    display: 'flex',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
    paddingVertical: 4.5,
    alignItems: 'center',
  },
  tableRowEven: {
    backgroundColor: '#f9fafb',
  },
  cellNo: { width: '4%', textAlign: 'center' },
  cellKode: { width: '19%', paddingLeft: 4, fontFamily: 'Helvetica-Bold' },
  cellNama: { width: '18%', paddingLeft: 4, fontFamily: 'Helvetica-Bold' },
  cellKategori: { width: '13%', paddingLeft: 4 },
  cellMerk: { width: '17%', paddingLeft: 4 },
  cellTahun: { width: '6%', textAlign: 'center' },
  cellHarga: { width: '12%', textAlign: 'right', paddingRight: 4, fontFamily: 'Helvetica-Bold' },
  cellKondisi: { width: '11%', textAlign: 'center' },

  kondisiNormal: { color: '#047857', fontFamily: 'Helvetica-Bold' },
  kondisiRusakRingan: { color: '#d97706', fontFamily: 'Helvetica-Bold' },
  kondisiRusakBerat: { color: '#dc2626', fontFamily: 'Helvetica-Bold' },
  kondisiHilang: { color: '#4b5563', fontFamily: 'Helvetica-Bold' },

  summaryRow: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#ecfdf5',
    borderTopWidth: 1.5,
    borderTopColor: '#059669',
    paddingVertical: 6,
    alignItems: 'center',
  },
  summaryLabel: {
    width: '77%',
    textAlign: 'right',
    paddingRight: 8,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    color: '#064e3b',
  },
  summaryValue: {
    width: '12%',
    textAlign: 'right',
    paddingRight: 4,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    color: '#047857',
  },

  footer: {
    position: 'absolute',
    bottom: '6mm',
    left: '10mm',
    right: '10mm',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#9ca3af',
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
    paddingTop: 4,
  },
});

const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('id-ID').format(val || 0);
};

const formatKondisiText = (kondisi: string): { label: string; style: any } => {
  switch (kondisi) {
    case 'NORMAL':
      return { label: 'Baik (B)', style: styles.kondisiNormal };
    case 'RUSAK_RINGAN':
      return { label: 'Rusak Ringan', style: styles.kondisiRusakRingan };
    case 'RUSAK_BERAT':
      return { label: 'Rusak Berat', style: styles.kondisiRusakBerat };
    case 'HILANG':
      return { label: 'Hilang', style: styles.kondisiHilang };
    default:
      return { label: kondisi || '-', style: {} };
  }
};

interface AssetTableDocumentProps {
  assets: any[];
  logoUrl?: string;
  isDemo?: boolean;
}

export const AssetTableDocument = ({ assets, logoUrl, isDemo }: AssetTableDocumentProps) => {
  // Sort assets by full code
  const sortedAssets = [...assets].sort((a, b) => {
    return (a.kodeLengkap || '').localeCompare(b.kodeLengkap || '');
  });

  const totalHarga = sortedAssets.reduce((sum, item) => sum + (item.harga || 0), 0);
  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Document title="Laporan Tabel Aset Inventaris SKPD">
      <Page size="A4" orientation="landscape" style={styles.page}>
        {isDemo && (
          <View style={styles.watermarkContainer} fixed>
            <Text style={styles.watermarkText}>DEMO VERSION</Text>
          </View>
        )}

        {/* Header Banner */}
        <View style={styles.headerBanner} fixed>
          <View style={styles.headerLeft}>
            {logoUrl ? <Image src={logoUrl} style={styles.logo} /> : null}
            <View style={styles.titleGroup}>
              <Text style={styles.mainTitle}>Laporan Inventarisasi Data Aset SKPD</Text>
              <Text style={styles.subTitle}>Diskominfo Kabupaten Bandung — SIM Aset SKPD</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.dateText}>Tanggal Cetak: {printDate}</Text>
            <Text style={styles.metaBadge}>{sortedAssets.length} Aset Terpilih</Text>
          </View>
        </View>

        {/* Table Header */}
        <View style={styles.table}>
          <View style={styles.tableHeader} fixed>
            <Text style={styles.cellNo}>No.</Text>
            <Text style={styles.cellKode}>Kode Klasifikasi Aset</Text>
            <Text style={styles.cellNama}>Nama Barang / Aset</Text>
            <Text style={styles.cellKategori}>Kategori</Text>
            <Text style={styles.cellMerk}>Merk / Type</Text>
            <Text style={styles.cellTahun}>Tahun</Text>
            <Text style={styles.cellHarga}>Harga (Rp)</Text>
            <Text style={styles.cellKondisi}>Kondisi</Text>
          </View>

          {/* Table Rows */}
          {sortedAssets.map((asset, index) => {
            const kondisiInfo = formatKondisiText(asset.kondisi);
            const isEven = index % 2 === 1;

            return (
              <View
                key={asset.id || index}
                style={[styles.tableRow, isEven ? styles.tableRowEven : {}]}
                wrap={false}
              >
                <Text style={styles.cellNo}>{index + 1}</Text>
                <Text style={styles.cellKode}>{asset.kodeLengkap || '-'}</Text>
                <Text style={styles.cellNama}>{asset.namaAset || '-'}</Text>
                <Text style={styles.cellKategori}>{asset.category?.nama || asset.categoryName || '-'}</Text>
                <Text style={styles.cellMerk}>{asset.merkType || '-'}</Text>
                <Text style={styles.cellTahun}>{asset.tahunPembelian || '-'}</Text>
                <Text style={styles.cellHarga}>Rp {formatCurrency(asset.harga)}</Text>
                <Text style={[styles.cellKondisi, kondisiInfo.style]}>{kondisiInfo.label}</Text>
              </View>
            );
          })}

          {/* Table Summary Footer */}
          <View style={styles.summaryRow} wrap={false}>
            <Text style={styles.summaryLabel}>TOTAL NILAI ASET TERPILIH:</Text>
            <Text style={styles.summaryValue}>Rp {formatCurrency(totalHarga)}</Text>
            <Text style={{ width: '11%' }} />
          </View>
        </View>

        {/* Page Footer */}
        <View style={styles.footer} fixed>
          <Text>Sistem Informasi Inventarisasi Aset SKPD — Diskominfo Kab. Bandung</Text>
          <Text
            render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} dari ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
};
