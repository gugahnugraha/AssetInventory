import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { DEFAULT_GOVERNMENT_NAME, DEFAULT_OPD_NAME } from '@/lib/constants';

Font.register({
  family: 'Helvetica-Bold',
  src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyCg4QxlF_8s.ttf'
});

// Nonaktifkan pemotongan kata (hyphenation) otomatis agar kata seperti KABUPATEN atau PERSANDIAN tidak terpotong
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    paddingTop: '10mm',
    paddingLeft: '20mm',
    paddingRight: '20mm',
    paddingBottom: '20mm',
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#000000',
    lineHeight: 1.5,
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingBottom: 4,
    paddingTop: 0,
    borderBottomWidth: 2.5,
    borderBottomColor: '#000000',
    borderBottomStyle: 'solid',
  },
  headerLeft: {
    width: 70,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 68,
    height: 85,
    objectFit: 'contain',
  },
  headerCenter: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 70,
  },
  headerTitleTop: {
    fontSize: 11.5,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  headerTitleMain: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 1.2,
  },
  headerAddress: {
    fontSize: 7.5,
    textAlign: 'center',
    lineHeight: 1.15,
    marginBottom: 0,
  },
  headerAddressSecond: {
    fontSize: 7.5,
    textAlign: 'center',
    lineHeight: 1.15,
    marginTop: 1,
    marginBottom: 2,
  },
  documentTitleContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  documentTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    textAlign: 'center',
    textDecoration: 'underline',
  },
  documentNumber: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  paragraph: {
    fontSize: 10,
    marginBottom: 10,
    textAlign: 'justify',
    textIndent: 30,
  },
  indentedBlock: {
    paddingLeft: 20,
    marginBottom: 10,
  },
  formRow: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 4,
  },
  formNumber: {
    width: 15,
  },
  formLabel: {
    width: 50,
  },
  formColon: {
    width: 15,
    textAlign: 'center',
  },
  formValue: {
    flex: 1,
  },
  dottedLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'dotted',
    width: '100%',
    height: 10,
    marginTop: -4,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  table: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderWidth: 1,
    borderColor: '#000',
    marginTop: 10,
    marginBottom: 15,
  },
  tableHeader: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#e4e4e7',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    alignItems: 'center',
    textAlign: 'center',
  },
  tableRow: {
    display: 'flex',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#000',
    alignItems: 'center',
    fontSize: 9,
  },
  colNo: {
    width: '5%',
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#000',
    textAlign: 'center',
  },
  colNama: {
    width: '25%',
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  colMerk: {
    width: '22%',
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  colRegister: {
    width: '30%',
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#000',
    textAlign: 'center',
  },
  colJumlah: {
    width: '8%',
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#000',
    textAlign: 'center',
  },
  colTahun: {
    width: '10%',
    padding: 4,
    textAlign: 'center',
  },
  signatureSection: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    paddingHorizontal: 20,
  },
  signatureBox: {
    width: '40%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  signatureTitle: {
    textAlign: 'center',
    marginBottom: 60,
  },
  signatureName: {
    fontFamily: 'Helvetica-Bold',
    textDecoration: 'underline',
    textAlign: 'center',
    marginBottom: 2,
    width: '100%',
  },
  signatureNip: {
    textAlign: 'center',
    width: '100%',
  },
  signatureSpace: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'dotted',
    marginBottom: 5,
    height: 12,
  },
});

interface AssetBASTDocumentProps {
  assets: any[];
  bastData?: {
    tanggal: string;
    pihakPertamaId: string;
    pihakKeduaId: string;
  };
  holders?: any[];
  opdName?: string;
  governmentName?: string;
}

export const AssetBASTDocument = ({ assets, bastData, holders = [], opdName, governmentName }: AssetBASTDocumentProps) => {
  const pihakPertama = holders.find(h => h.id === bastData?.pihakPertamaId);
  const pihakKedua = holders.find(h => h.id === bastData?.pihakKeduaId);

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '........................................................................';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formattedDate = formatDate(bastData?.tanggal);
  const getDay = (dateStr?: string) => {
    if (!dateStr) return '...................................';
    return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long' });
  };
  const getFullDate = (dateStr?: string) => {
    if (!dateStr) return '........................................................................';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatBidangName = (nama?: string, fallback: string = '') => {
    if (!nama) return fallback;
    if (nama.toLowerCase() === 'sekretariat') return 'Sekretariat';
    if (nama.toLowerCase().startsWith('bidang')) return nama;
    return `Bidang ${nama}`;
  };

  const dayName = getDay(bastData?.tanggal);
  const dateOnly = getFullDate(bastData?.tanggal);
  
  const resolvedGovName = governmentName || DEFAULT_GOVERNMENT_NAME;
  const resolvedOpdName = opdName || DEFAULT_OPD_NAME;
  const isDiskominfo = resolvedOpdName.toLowerCase().includes("komunikasi") || resolvedOpdName.toLowerCase().includes("diskominfo");
  
  const addressText = isDiskominfo 
    ? "Jl. Raya Soreang KM.17 Tlp (022) 5897514 Soreang 40911 Jawa Barat"
    : "";
  const websiteEmailText = isDiskominfo 
    ? "Email : diskominfo@bandungkab.go.id  Website : www.bandungkab.go.id"
    : "";

  const formatKopOpdName = (name: string) => {
    let upper = name.toUpperCase().trim();

    // Hapus "KABUPATEN BANDUNG" setelah kata persandian karena sudah diwakili oleh "PEMERINTAH KABUPATEN BANDUNG"
    upper = upper.replace(/\s+KABUPATEN\s+BANDUNG\s*$/i, "").trim();
    upper = upper.replace(/\s+KAB\.\s+BANDUNG\s*$/i, "").trim();

    if (upper.includes("DAN PERSANDIAN")) {
      const idx = upper.indexOf("DAN PERSANDIAN");
      const line1 = upper.slice(0, idx).trim();
      const line2 = upper.slice(idx).trim();
      return `${line1}\n${line2}`;
    }
    if (upper.length > 45 && upper.includes(" DAN ")) {
      const idx = upper.indexOf(" DAN ");
      const line1 = upper.slice(0, idx).trim();
      const line2 = upper.slice(idx + 1).trim();
      return `${line1}\n${line2}`;
    }
    return upper;
  };

  return (
    <Document title="Berita Acara Serah Terima (BAST) Barang Milik Daerah">
      <Page size="LEGAL" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* We assume the logo is available at /logo.png in public folder */}
            <Image src="/logo.png" style={styles.logo} />
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitleTop}>{resolvedGovName.toUpperCase()}</Text>
            <Text style={styles.headerTitleMain}>{formatKopOpdName(resolvedOpdName)}</Text>
            {addressText ? <Text style={styles.headerAddress}>{addressText}</Text> : null}
            {websiteEmailText ? <Text style={styles.headerAddressSecond}>{websiteEmailText}</Text> : null}
          </View>
        </View>

        {/* Title */}
        <View style={styles.documentTitleContainer}>
          <Text style={styles.documentTitle}>BERITA ACARA SERAH TERIMA (BAST) BARANG MILIK DAERAH</Text>
          <Text style={styles.documentNumber}>Nomor: ..............................................................</Text>
        </View>

        {/* Content */}
        <Text style={styles.paragraph}>
          Pada hari ini {dayName}, tanggal {dateOnly} bertempat di {resolvedOpdName}, kami yang bertanda tangan di bawah ini:
        </Text>

        <View style={styles.indentedBlock}>
          <View style={styles.formRow}>
            <Text style={styles.formNumber}>1.</Text>
            <Text style={styles.formLabel}>Nama</Text>
            <Text style={styles.formColon}>:</Text>
            <Text style={styles.formValue}>{pihakPertama?.nama}</Text>
          </View>
          <View style={styles.formRow}>
            <Text style={styles.formNumber}></Text>
            <Text style={styles.formLabel}>NIP</Text>
            <Text style={styles.formColon}>:</Text>
            <Text style={styles.formValue}>{pihakPertama?.nip}</Text>
          </View>
          <View style={styles.formRow}>
            <Text style={styles.formNumber}></Text>
            <Text style={styles.formLabel}>Jabatan</Text>
            <Text style={styles.formColon}>:</Text>
            <Text style={styles.formValue}>{pihakPertama?.jabatan}</Text>
          </View>
        </View>
        <Text style={styles.paragraph}>
          Dalam hal ini bertindak untuk dan atas nama {formatBidangName(pihakPertama?.distribution?.nama, 'Bidang Teknologi Informasi dan Komunikasi')} Dinas Komunikasi, Informatika, Statistik dan Persandian Kabupaten Bandung, selanjutnya disebut sebagai <Text style={styles.bold}>PIHAK PERTAMA</Text> (yang menyerahkan).
        </Text>

        <View style={styles.indentedBlock}>
          <View style={styles.formRow}>
            <Text style={styles.formNumber}>2.</Text>
            <Text style={styles.formLabel}>Nama</Text>
            <Text style={styles.formColon}>:</Text>
            <Text style={styles.formValue}>{pihakKedua?.nama}</Text>
          </View>
          <View style={styles.formRow}>
            <Text style={styles.formNumber}></Text>
            <Text style={styles.formLabel}>NIP</Text>
            <Text style={styles.formColon}>:</Text>
            <Text style={styles.formValue}>{pihakKedua?.nip}</Text>
          </View>
          <View style={styles.formRow}>
            <Text style={styles.formNumber}></Text>
            <Text style={styles.formLabel}>Jabatan</Text>
            <Text style={styles.formColon}>:</Text>
            <Text style={styles.formValue}>{pihakKedua?.jabatan}</Text>
          </View>
        </View>
        <Text style={styles.paragraph}>
          Dalam hal ini bertindak untuk dan atas nama {formatBidangName(pihakKedua?.distribution?.nama, 'Sekretariat')} Dinas Komunikasi, Informatika, Statistik dan Persandian Kabupaten Bandung, selanjutnya disebut sebagai <Text style={styles.bold}>PIHAK KEDUA</Text> (yang menerima).
        </Text>

        <Text style={styles.paragraph}>
          Dengan ini menerangkan bahwa <Text style={styles.bold}>PIHAK PERTAMA</Text> telah menyerahkan barang milik daerah dalam kondisi rusak berat kepada <Text style={styles.bold}>PIHAK KEDUA</Text> untuk selanjutnya diproses sesuai dengan ketentuan peraturan perundang-undangan yang berlaku mengenai penghapusan Barang Milik Daerah (BMD), dengan rincian sebagaimana terlampir.
        </Text>
        <Text style={styles.paragraph}>
          Barang-barang tersebut dalam kondisi rusak berat dan sudah tidak dapat dipergunakan/dioperasikan sebagaimana mestinya, sehingga diserahkan kepada Sekretariat untuk selanjutnya diusulkan proses penghapusan dari Daftar Barang Milik Daerah sesuai dengan mekanisme dan peraturan yang berlaku.
        </Text>
        <Text style={styles.paragraph}>
          Demikian Berita Acara Serah Terima ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.
        </Text>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>PIHAK PERTAMA,{'\n'}{pihakPertama?.jabatan || 'Kepala Bidang Teknologi Informasi dan Komunikasi'}</Text>
            {pihakPertama ? (
              <>
                <Text style={styles.signatureName}>{pihakPertama.nama}</Text>
                <Text style={styles.signatureNip}>NIP. {pihakPertama.nip}</Text>
              </>
            ) : (
              <Text style={styles.signatureNip}>NIP. ........................................</Text>
            )}
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>PIHAK KEDUA,{'\n'}{pihakKedua?.jabatan || 'Bendahara Barang'}</Text>
            <Text style={styles.signatureName}>{pihakKedua?.nama || 'Abuy sobur'}</Text>
            <Text style={styles.signatureNip}>NIP. {pihakKedua?.nip || '197108012009011002'}</Text>
          </View>
        </View>

      </Page>

      <Page size="LEGAL" style={styles.page}>
        <View style={styles.documentTitleContainer}>
          <Text style={styles.documentTitle}>LAMPIRAN BERITA ACARA SERAH TERIMA</Text>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colNo}>No.</Text>
            <Text style={styles.colNama}>Nama Barang</Text>
            <Text style={styles.colMerk}>Merk / Tipe</Text>
            <Text style={styles.colRegister}>No. Register / Kode Aset</Text>
            <Text style={styles.colJumlah}>Jumlah</Text>
            <Text style={styles.colTahun}>Tahun</Text>
          </View>
          {assets.map((asset, index) => {
            return (
              <View style={styles.tableRow} key={asset.id || index}>
                <Text style={styles.colNo}>{index + 1}</Text>
                <Text style={styles.colNama}>{asset.namaAset}</Text>
                <Text style={styles.colMerk}>{asset.merkType || '-'}</Text>
                <Text style={styles.colRegister}>{asset.kodeLengkap}</Text>
                <Text style={styles.colJumlah}>1</Text>
                <Text style={styles.colTahun}>{asset.tahunPembelian || '-'}</Text>
              </View>
            );
          })}
        </View>
      </Page>
    </Document>
  );
};
