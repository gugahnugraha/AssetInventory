import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

Font.register({
  family: 'Helvetica-Bold',
  src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyCg4QxlF_8s.ttf'
});

const styles = StyleSheet.create({
  page: {
    paddingTop: '20mm',
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
    marginBottom: 5,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    borderBottomStyle: 'solid',
  },
  headerLeft: {
    width: '15%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 60,
    height: 75,
    objectFit: 'contain',
  },
  headerCenter: {
    width: '85%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 10,
  },
  headerTitleTop: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  headerTitleMain: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  headerAddress: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 2,
    fontStyle: 'italic',
  },
  documentTitleContainer: {
    marginTop: 20,
    marginBottom: 20,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  documentTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    textDecoration: 'underline',
    textAlign: 'center',
  },
  documentNumber: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  paragraph: {
    marginBottom: 10,
    textAlign: 'justify',
  },
  indentedBlock: {
    marginLeft: 20,
    marginBottom: 10,
  },
  formRow: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 3,
  },
  formLabel: {
    width: 60,
  },
  formColon: {
    width: 10,
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
    width: '20%',
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  colRegister: {
    width: '20%',
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
  colKondisi: {
    width: '12%',
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
}

export const AssetBASTDocument = ({ assets }: AssetBASTDocumentProps) => {
  return (
    <Document title="Berita Acara Serah Terima (BAST) Barang Milik Daerah">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* We assume the logo is available at /logo.png in public folder */}
            <Image src="/logo.png" style={styles.logo} />
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitleTop}>PEMERINTAH KABUPATEN BANDUNG</Text>
            <Text style={styles.headerTitleMain}>DINAS KOMUNIKASI, INFORMATIKA, STATISTIK DAN PERSANDIAN</Text>
            <Text style={styles.headerAddress}>
              Alamat: Jl. Raya Soreang KM. 17 Soreang 40911 Jawa Barat | Tlp. (022) 5897514 | Website: https://diskominfo.bandungkab.go.id | Email: diskominfo@bandungkab.go.id
            </Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.documentTitleContainer}>
          <Text style={styles.documentTitle}>BERITA ACARA SERAH TERIMA (BAST) BARANG MILIK DAERAH</Text>
          <Text style={styles.documentNumber}>Nomor: ..............................................................</Text>
        </View>

        {/* Content */}
        <Text style={styles.paragraph}>
          Pada hari ini,..................................., tanggal ........................................................................ bertempat di Dinas Komunikasi, Informatika, Statistik dan Persandian Kabupaten Bandung, kami yang bertanda tangan di bawah ini:
        </Text>

        <View style={styles.indentedBlock}>
          <Text style={{ marginBottom: 5 }}>1. Nama               : ......................................................................................</Text>
          <Text style={{ marginBottom: 5 }}>    NIP                  : ......................................................................................</Text>
          <Text style={{ marginBottom: 5 }}>    Jabatan           : ......................................................................................</Text>
        </View>
        <Text style={styles.paragraph}>
          Dalam hal ini bertindak untuk dan atas nama Bidang Teknologi Informasi dan Komunikasi Dinas Komunikasi, Informatika, Statistik dan Persandian Kabupaten Bandung, selanjutnya disebut sebagai <Text style={styles.bold}>PIHAK PERTAMA</Text> (yang menyerahkan).
        </Text>

        <View style={styles.indentedBlock}>
          <Text style={{ marginBottom: 5 }}>2. Nama               : Abuy sobur</Text>
          <Text style={{ marginBottom: 5 }}>    NIP                  : 197108012009011002</Text>
          <Text style={{ marginBottom: 5 }}>    Jabatan           : Bendahara Barang</Text>
        </View>
        <Text style={styles.paragraph}>
          Dalam hal ini bertindak untuk dan atas nama Sekretariat Dinas Komunikasi, Informatika, Statistik dan Persandian Kabupaten Bandung, selanjutnya disebut sebagai <Text style={styles.bold}>PIHAK KEDUA</Text> (yang menerima).
        </Text>

        <Text style={styles.paragraph}>
          Dengan ini menerangkan bahwa <Text style={styles.bold}>PIHAK PERTAMA</Text> telah menyerahkan barang milik daerah dalam kondisi rusak berat kepada <Text style={styles.bold}>PIHAK KEDUA</Text> untuk selanjutnya diproses sesuai dengan ketentuan peraturan perundang-undangan yang berlaku mengenai penghapusan Barang Milik Daerah (BMD), dengan rincian sebagai berikut:
        </Text>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colNo}>No.</Text>
            <Text style={styles.colNama}>Nama Barang</Text>
            <Text style={styles.colMerk}>Merk / Tipe</Text>
            <Text style={styles.colRegister}>No. Register / Kode Aset</Text>
            <Text style={styles.colJumlah}>Jumlah</Text>
            <Text style={styles.colKondisi}>Kondisi</Text>
            <Text style={styles.colTahun}>Tahun</Text>
          </View>
          {assets.map((asset, index) => {
            const kondisiText = asset.kondisi === 'RUSAK_BERAT' ? 'Rusak Berat' : 
                               asset.kondisi === 'RUSAK_RINGAN' ? 'Rusak Ringan' :
                               asset.kondisi === 'HILANG' ? 'Hilang' :
                               asset.kondisi === 'NORMAL' ? 'Baik' : asset.kondisi;
            return (
              <View style={styles.tableRow} key={asset.id || index}>
                <Text style={styles.colNo}>{index + 1}</Text>
                <Text style={styles.colNama}>{asset.namaAset}</Text>
                <Text style={styles.colMerk}>{asset.merkType || '-'}</Text>
                <Text style={styles.colRegister}>{asset.kodeLengkap}</Text>
                <Text style={styles.colJumlah}>1</Text>
                <Text style={styles.colKondisi}>{kondisiText}</Text>
                <Text style={styles.colTahun}>{asset.tahunPembelian || '-'}</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.paragraph}>
          Barang-barang tersebut di atas dalam kondisi rusak berat dan sudah tidak dapat dipergunakan/dioperasikan sebagaimana mestinya, sehingga diserahkan kepada Sekretariat untuk selanjutnya diusulkan proses penghapusan dari Daftar Barang Milik Daerah sesuai dengan mekanisme dan peraturan yang berlaku.
        </Text>
        <Text style={styles.paragraph}>
          Demikian Berita Acara Serah Terima ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.
        </Text>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>PIHAK PERTAMA,{'\n'}Kepala Bidang Teknologi Informasi dan Komunikasi</Text>
            <View style={styles.signatureSpace}></View>
            <Text style={styles.signatureNip}>NIP. ........................................</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>PIHAK KEDUA,{'\n'}Bendahara Barang</Text>
            <View style={styles.signatureSpace}></View>
            <Text style={styles.signatureName}>Abuy sobur</Text>
            <Text style={styles.signatureNip}>NIP. 197108012009011002</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
};
