import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    paddingTop: '8mm',
    paddingLeft: '10mm',
    paddingRight: '10mm',
    paddingBottom: '10mm',
    fontSize: 7.5,
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
    zIndex: 99999,
  },
  watermarkText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 75,
    color: '#dc2626',
    opacity: 0.25,
    transform: 'rotate(-30deg)',
    textTransform: 'uppercase',
    letterSpacing: 5,
  },
  headerContainer: {
    marginBottom: 8,
    textAlign: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#0f766e',
    paddingBottom: 6,
  },
  docTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    color: '#0f766e',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  docSubTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: '#27272a',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  metaGrid: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 6,
  },
  metaCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  metaRow: {
    display: 'flex',
    flexDirection: 'row',
  },
  metaLabel: {
    width: 85,
    fontSize: 7.5,
    color: '#64748b',
    fontFamily: 'Helvetica-Bold',
  },
  metaValue: {
    flex: 1,
    fontSize: 7.5,
    color: '#1e293b',
  },
  table: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },
  tableHeader: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    color: '#334155',
    textAlign: 'center',
    alignItems: 'center',
  },
  tableRow: {
    display: 'flex',
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
    alignItems: 'center',
    minHeight: 18,
  },
  tableRowEven: {
    backgroundColor: '#fafafa',
  },
  colNo: { width: '4%', padding: 3, textAlign: 'center' },
  colKode: { width: '15%', padding: 3 },
  colNama: { width: '18%', padding: 3 },
  colMerk: { width: '15%', padding: 3 },
  colBahan: { width: '8%', padding: 3 },
  colTahun: { width: '6%', padding: 3, textAlign: 'center' },
  colKondisi: { width: '7%', padding: 3, textAlign: 'center' },
  colHarga: { width: '13%', padding: 3, textAlign: 'right' },
  colPemegang: { width: '14%', padding: 3 },

  footerSignatures: {
    marginTop: 12,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  signatureBox: {
    width: '42%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  signTitle: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 45,
  },
  signName: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textDecoration: 'underline',
  },
  signNip: {
    fontSize: 7.5,
    color: '#475569',
    marginTop: 1,
  },
});

interface KirDocumentProps {
  room: {
    nama: string;
    kode: string;
    lantai?: string | null;
    distribution: {
      id?: string;
      nama: string;
      opd?: {
        nama: string;
      };
    };
    pjHolder?: {
      nama: string;
      nip: string;
      jabatan: string;
    } | null;
    assets: Array<{
      id: string;
      kodeLengkap: string;
      namaAset: string;
      merkType: string;
      material?: string | null;
      tahunPembelian: number;
      harga: number;
      kondisi: string;
      catatan?: string | null;
      distribution?: {
        id?: string;
        nama: string;
      } | null;
      holder?: {
        nama: string;
      } | null;
    }>;
  };
  opdName?: string;
  isDemo?: boolean;
}

export const KirDocument = ({ room, opdName, isDemo }: KirDocumentProps) => {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const resolvedOpd = opdName || room.distribution.opd?.nama || "Pemerintah Daerah";
  const assets = room.assets || [];
  const totalValue = assets.reduce((sum, a) => sum + (a.harga || 0), 0);
  const hasCrossBidangAssets = assets.some(
    (a) => a.distribution && a.distribution.nama !== room.distribution.nama
  );

  const getKondisiLabel = (k: string) => {
    switch (k) {
      case 'NORMAL':
        return 'Baik';
      case 'RUSAK_RINGAN':
        return 'R. Ringan';
      case 'RUSAK_BERAT':
        return 'R. Berat';
      default:
        return k;
    }
  };

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {isDemo && (
          <View style={styles.watermarkContainer} fixed>
            <Text style={styles.watermarkText}>MODE DEMO</Text>
          </View>
        )}

        {/* HEADER */}
        <View style={styles.headerContainer}>
          <Text style={styles.docTitle}>KARTU INVENTARIS RUANGAN (KIR)</Text>
          <Text style={styles.docSubTitle}>{resolvedOpd}</Text>
        </View>

        {/* METADATA RUANGAN */}
        <View style={styles.metaGrid}>
          <View style={styles.metaCol}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>SKPD / OPD</Text>
              <Text style={styles.metaValue}>: {resolvedOpd}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Bidang / Unit Kerja</Text>
              <Text style={styles.metaValue}>: {room.distribution.nama}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Nama Ruangan</Text>
              <Text style={styles.metaValue}>: {room.nama}</Text>
            </View>
          </View>
          <View style={styles.metaCol}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Kode Ruangan</Text>
              <Text style={styles.metaValue}>: {room.kode}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Lokasi / Lantai</Text>
              <Text style={styles.metaValue}>: {room.lantai || '-'}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Total Barang / Nilai</Text>
              <Text style={styles.metaValue}>
                : {assets.length} Unit (Rp {totalValue.toLocaleString('id-ID')})
              </Text>
            </View>
          </View>
        </View>

        {/* TABEL BARANG */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colNo}>No</Text>
            <Text style={styles.colKode}>Kode Lengkap Barang</Text>
            <Text style={styles.colNama}>Nama / Jenis Barang</Text>
            <Text style={styles.colMerk}>Merk / Tipe / Spesifikasi</Text>
            <Text style={styles.colBahan}>Bahan</Text>
            <Text style={styles.colTahun}>Tahun</Text>
            <Text style={styles.colKondisi}>Kondisi</Text>
            <Text style={styles.colHarga}>Harga Perolehan</Text>
            <Text style={styles.colPemegang}>Pemegang / PIC</Text>
          </View>

          {assets.length === 0 ? (
            <View style={[styles.tableRow, { justifyContent: 'center', padding: 10 }]}>
              <Text style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                Belum ada aset/barang yang ditempatkan di ruangan ini.
              </Text>
            </View>
          ) : (
            assets.map((asset, index) => (
              <View
                key={asset.id}
                style={[styles.tableRow, index % 2 === 1 ? styles.tableRowEven : {}]}
              >
                <Text style={styles.colNo}>{index + 1}</Text>
                <Text style={styles.colKode}>{asset.kodeLengkap}</Text>
                <View style={styles.colNama}>
                  <Text>{asset.namaAset}</Text>
                  {asset.distribution && asset.distribution.nama !== room.distribution.nama && (
                    <Text style={{ fontSize: 6.2, color: '#0369a1', marginTop: 1 }}>
                      [Tercatat: {asset.distribution.nama}]
                    </Text>
                  )}
                </View>
                <Text style={styles.colMerk}>{asset.merkType}</Text>
                <Text style={styles.colBahan}>{asset.material || '-'}</Text>
                <Text style={styles.colTahun}>{asset.tahunPembelian}</Text>
                <Text style={styles.colKondisi}>{getKondisiLabel(asset.kondisi)}</Text>
                <Text style={styles.colHarga}>Rp {asset.harga.toLocaleString('id-ID')}</Text>
                <Text style={styles.colPemegang}>{asset.holder?.nama || '-'}</Text>
              </View>
            ))
          )}
        </View>

        {hasCrossBidangAssets && (
          <View style={{ marginBottom: 6 }}>
            <Text style={{ fontSize: 6.5, color: '#475569', fontStyle: 'italic' }}>
              * Keterangan [Tercatat: ...]: Aset tercatat secara administratif di bidang tersebut, namun ditempatkan secara fisik di ruangan ini.
            </Text>
          </View>
        )}

        {/* PENGESAHAN TANDA TANGAN */}
        <View style={styles.footerSignatures}>
          <View style={styles.signatureBox}>
            <Text style={styles.signTitle}>Mengetahui,{"\n"}Pengurus Barang / Pengguna Barang</Text>
            <Text style={styles.signName}>( .................................................... )</Text>
            <Text style={styles.signNip}>NIP. ....................................................</Text>
          </View>

          <View style={styles.signatureBox}>
            <Text style={styles.signTitle}>
              Dibuat di tempat, {currentDate}{"\n"}Penanggung Jawab Ruangan
            </Text>
            <Text style={styles.signName}>
              ( {room.pjHolder?.nama || "...................................................." } )
            </Text>
            <Text style={styles.signNip}>
              NIP. {room.pjHolder?.nip || "...................................................." }
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
