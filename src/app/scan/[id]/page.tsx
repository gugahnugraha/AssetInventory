import { getAssetById } from "@/services/asset";
import { DocumentService } from "@/services/document";
import { ScanAssetClient, ScanAssetNotFound, ScanAssetError } from "./ScanAssetClient";

export const metadata = {
  title: "Detail Aset Publik - AssetInventory",
  description: "Informasi detail aset melalui scan QR Code.",
};

interface ScanAssetPageProps {
  params: Promise<{ id: string }>;
}

export default async function ScanAssetPage({ params }: ScanAssetPageProps) {
  const { id } = await params;

  try {
    const asset = await getAssetById(id);

    if (!asset) {
      return <ScanAssetNotFound />;
    }

    const fotoUrl = asset.fotoUtama ? DocumentService.generateFileUrl(asset.fotoUtama) : null;

    return <ScanAssetClient asset={asset} fotoUrl={fotoUrl} />;
  } catch (error) {
    console.error("Failed to load public asset detail page:", error);
    return <ScanAssetError />;
  }
}
