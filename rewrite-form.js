const fs = require('fs');

const formContent = `        <div className="lg:col-span-2">
          {/* TAB: UTAMA */}
          <div className={activeTab === "utama" ? "space-y-6 block" : "hidden"}>
            <Card className="border-zinc-200/80 dark:border-zinc-800/80">
              <CardHeader className="border-b border-zinc-100 dark:border-zinc-800">
                <CardTitle>Identitas Utama</CardTitle>
                <CardDescription>Pilih KIB, kategori, dan detail identitas dasar aset.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {/* KIB & Kategori */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                      Klasifikasi KIB <span className="text-rose-500">*</span>
                    </label>
                    <input type="hidden" {...register("kibId")} />
                    <div className="w-full h-10 rounded-md border border-sky-200 bg-sky-50 dark:bg-sky-900/20 dark:border-sky-800 px-3 py-2 text-sm flex items-center gap-2 cursor-not-allowed">
                      <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                        {(() => { const kibB = kibs.find((k: any) => k.kode === "B"); return kibB ? \`KIB \${kibB.kode} - \${kibB.nama}\` : "KIB B - Peralatan dan Mesin"; })()}
                      </span>
                      <span className="ml-auto text-[10px] uppercase tracking-widest text-sky-500 bg-sky-100 dark:bg-sky-900/40 px-1.5 py-0.5 rounded font-semibold">Sistem</span>
                    </div>
                    {errors.kibId && <p className="text-xs text-rose-500 mt-1">{errors.kibId.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                      Kategori Aset <span className="text-rose-500">*</span>
                    </label>
                    <select
                      {...register("categoryId")}
                      disabled={!watchKibId}
                      className="w-full h-10 rounded-md border border-zinc-200 dark:border-zinc-800 bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    >
                      <option value="" className="bg-background text-foreground">Pilih Kategori</option>
                      {filteredCategories.map((c) => (
                        <option key={c.id} value={c.id} className="bg-background text-foreground">
                          {c.nama}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && <p className="text-xs text-rose-500 mt-1">{errors.categoryId.message}</p>}
                  </div>
                </div>

                {/* Nama Aset & Merk/Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                      Nama Aset <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      placeholder="Contoh: Mobil Avanza, Laptop ThinkPad"
                      {...register("namaAset")}
                    />
                    {errors.namaAset && <p className="text-xs text-rose-500 mt-1">{errors.namaAset.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                      Merk / Type <span className="text-rose-500">*</span>
                    </label>
                    <input type="hidden" {...register("merkType")} />

                    {!watchCategoryId ? (
                      <div className="text-xs text-zinc-500 italic p-3 border border-dashed rounded-md bg-zinc-50/50 dark:bg-zinc-900/10">
                        Pilih Kategori Aset terlebih dahulu untuk memunculkan pilihan Merk
                      </div>
                    ) : availableBrands.length > 0 ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <select
                              value={selectedBrand}
                              onChange={(e) => {
                                setSelectedBrand(e.target.value);
                                if (e.target.value !== "LAINNYA") {
                                  setCustomBrand("");
                                }
                              }}
                              className="w-full h-10 rounded-md border border-zinc-200 dark:border-zinc-800 bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              <option value="" className="bg-background text-foreground">Pilih Merk / Brand</option>
                              {availableBrands.map((b) => (
                                <option key={b} value={b} className="bg-background text-foreground">
                                  {b}
                                </option>
                              ))}
                              <option value="LAINNYA" className="bg-background text-foreground font-semibold">Lainnya (Input Manual)</option>
                            </select>
                          </div>

                          {selectedBrand && selectedBrand !== "LAINNYA" && (
                            <Input
                              placeholder="Tipe / Model (e.g. L14 Gen 3)"
                              value={typeDetail}
                              onChange={(e) => setTypeDetail(e.target.value)}
                            />
                          )}

                          {selectedBrand === "LAINNYA" && (
                            <Input
                              placeholder="Masukkan Merk & Tipe Aset..."
                              value={customBrand}
                              onChange={(e) => setCustomBrand(e.target.value)}
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      <Input
                        placeholder="Contoh: Lenovo L14 Gen 3, Kayu Jati"
                        value={customBrand}
                        onChange={(e) => {
                          setSelectedBrand("LAINNYA");
                          setCustomBrand(e.target.value);
                        }}
                      />
                    )}
                    {errors.merkType && <p className="text-xs text-rose-500 mt-1">{errors.merkType.message}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-200/80 dark:border-zinc-800/80">
              <CardHeader className="border-b border-zinc-100 dark:border-zinc-800">
                <CardTitle>Kode Aset</CardTitle>
                <CardDescription>Masukkan kode registrasi aset barang.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <div className="grid grid-cols-5 gap-2">
                    <div>
                      <Input
                        placeholder="XX"
                        maxLength={2}
                        className="text-center font-mono font-bold"
                        {...register("kode1")}
                      />
                      {errors.kode1 && <p className="text-[10px] text-rose-500 mt-1">{errors.kode1.message}</p>}
                    </div>
                    <div>
                      <Input
                        placeholder="XX"
                        maxLength={2}
                        className="text-center font-mono font-bold"
                        {...register("kode2")}
                      />
                      {errors.kode2 && <p className="text-[10px] text-rose-500 mt-1">{errors.kode2.message}</p>}
                    </div>
                    <div>
                      <Input
                        placeholder="XX"
                        maxLength={2}
                        className="text-center font-mono font-bold"
                        {...register("kode3")}
                      />
                      {errors.kode3 && <p className="text-[10px] text-rose-500 mt-1">{errors.kode3.message}</p>}
                    </div>
                    <div>
                      <Input
                        placeholder="XX"
                        maxLength={2}
                        className="text-center font-mono font-bold"
                        {...register("kode4")}
                      />
                      {errors.kode4 && <p className="text-[10px] text-rose-500 mt-1">{errors.kode4.message}</p>}
                    </div>
                    <div>
                      <Input
                        placeholder="XXX"
                        maxLength={3}
                        className="text-center font-mono font-bold"
                        {...register("kode5")}
                      />
                      {errors.kode5 && <p className="text-[10px] text-rose-500 mt-1">{errors.kode5.message}</p>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border text-sm mt-2">
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">Format Kode Lengkap:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-base tracking-wider">
                      {kodeLengkapPreview}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-200/80 dark:border-emerald-800/80 bg-emerald-50/30 dark:bg-emerald-900/10">
              <CardHeader className="border-b border-emerald-100 dark:border-emerald-800/50 pb-4">
                <CardTitle className="text-emerald-800 dark:text-emerald-300">Nomor Register Aset</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    Nomor Register <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder="XXXX"
                    className="font-mono font-bold focus-visible:ring-emerald-500 focus-visible:border-emerald-500 bg-white dark:bg-zinc-950"
                    {...register("nomorRegister")}
                  />
                  {errors.nomorRegister && <p className="text-[10px] text-rose-500 mt-1">{errors.nomorRegister.message}</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* TAB: SPESIFIKASI */}
          <div className={activeTab === "spesifikasi" ? "space-y-6 block" : "hidden"}>
            <Card className="border-zinc-200/80 dark:border-zinc-800/80">
              <CardHeader className="border-b border-zinc-100 dark:border-zinc-800">
                <CardTitle>Spesifikasi & Harga</CardTitle>
                <CardDescription>Lengkapi data spesifikasi fisik dan perolehan.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      Material / Bahan
                    </label>
                    <Input
                      placeholder="Contoh: Aluminium, Kayu Jati, Plastik ABS"
                      {...register("material")}
                    />
                    {errors.material && <p className="text-xs text-rose-500 mt-1">{errors.material.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      Cara Perolehan
                    </label>
                    <select
                      {...register("caraPerolehan")}
                      className="w-full h-10 rounded-md border border-zinc-200 dark:border-zinc-800 bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">-- Pilih Cara Perolehan --</option>
                      <option value="Pembelian">Pembelian</option>
                      <option value="Hibah">Hibah</option>
                      <option value="Produksi Sendiri">Produksi Sendiri</option>
                      <option value="Tukar Menukar">Tukar Menukar</option>
                      <option value="Bantuan Pusat">Bantuan Pusat</option>
                      <option value="Bantuan Provinsi">Bantuan Provinsi</option>
                      <option value="Sumbangan / Donasi">Sumbangan / Donasi</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                    {errors.caraPerolehan && <p className="text-xs text-rose-500 mt-1">{errors.caraPerolehan.message}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Spesifikasi Teknis
                  </label>
                  <textarea
                    placeholder="Contoh: Prosesor Intel Core i5 Gen 11, RAM 8GB DDR4, SSD 512GB NVMe, Layar 14 inci FHD IPS"
                    rows={3}
                    className="flex w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    {...register("spesifikasi")}
                  />
                  {errors.spesifikasi && <p className="text-xs text-rose-500 mt-1">{errors.spesifikasi.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                      Harga Perolehan (Rp) <span className="text-rose-500">*</span>
                    </label>
                    <input type="hidden" {...register("harga")} />
                    <Input
                      type="text"
                      placeholder="Contoh: 15.000.000"
                      value={formattedHarga}
                      onChange={(e) => {
                        const rawValStr = e.target.value.replace(/\\D/g, "");
                        const rawNum = rawValStr ? parseInt(rawValStr, 10) : 0;
                        setFormattedHarga(formatNumberWithSeparator(rawValStr));
                        setValue("harga", rawNum, { shouldValidate: true });
                      }}
                    />
                    {errors.harga && <p className="text-xs text-rose-500 mt-1">{errors.harga.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                      Tahun Perolehan <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="number"
                      placeholder="Tahun"
                      {...register("tahunPembelian")}
                    />
                    {errors.tahunPembelian && <p className="text-xs text-rose-500 mt-1">{errors.tahunPembelian.message}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dynamic Attributes Form Section */}
            {categoryAttributes.length > 0 && (
              <Card className="border-zinc-200/80 dark:border-zinc-800/80">
                <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <CardTitle className="text-emerald-700 font-bold">Atribut Tambahan ({selectedCategory?.nama})</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categoryAttributes.map((attr) => (
                    <div key={attr.name} className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                        {attr.name} {attr.required && <span className="text-rose-500">*</span>}
                      </label>
                      
                      {attr.type === "SELECT" && attr.options ? (
                        <select
                          {...register(\`dynamicAttributes.\${attr.name}\`)}
                          className="w-full h-10 rounded-md border border-zinc-200 dark:border-zinc-800 bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="">-- Pilih {attr.name} --</option>
                          {attr.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : attr.type === "NUMBER" ? (
                        <Input
                          type="number"
                          placeholder={\`Masukkan nilai \${attr.name}\`}
                          {...register(\`dynamicAttributes.\${attr.name}\`)}
                        />
                      ) : (
                        <Input
                          type="text"
                          placeholder={\`Masukkan \${attr.name}\`}
                          {...register(\`dynamicAttributes.\${attr.name}\`)}
                        />
                      )}
                      
                      {errors.dynamicAttributes?.[attr.name] && (
                        <p className="text-[10px] text-rose-500 mt-1">{(errors.dynamicAttributes as any)[attr.name]?.message}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* TAB: PENEMPATAN */}
          <div className={activeTab === "penempatan" ? "space-y-6 block" : "hidden"}>
            <Card className="border-zinc-200/80 dark:border-zinc-800/80">
              <CardHeader className="border-b border-zinc-100 dark:border-zinc-800">
                <CardTitle>Penempatan & Kondisi Aset</CardTitle>
                <CardDescription>Tentukan pemegang barang dan kondisi terkini.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                      Bidang / Distribusi <span className="text-rose-500">*</span>
                    </label>
                    <select
                      {...register("distributionId")}
                      disabled={disableFields}
                      className="w-full h-10 rounded-md border border-zinc-200 dark:border-zinc-800 bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    >
                      <option value="">Pilih Bidang</option>
                      {distributions.map((d) => (
                        <option key={d.id} value={d.id}>{d.nama}</option>
                      ))}
                    </select>
                    {errors.distributionId && <p className="text-[10px] text-rose-500 mt-1">{errors.distributionId.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      Pemegang Barang
                    </label>
                    <select
                      {...register("holderId")}
                      disabled={disableFields}
                      className="w-full h-10 rounded-md border border-zinc-200 dark:border-zinc-800 bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    >
                      <option value="">-- Pilih Pemegang --</option>
                      {holders.map((h) => (
                        <option key={h.id} value={h.id}>{h.nama} ({h.nip})</option>
                      ))}
                    </select>
                    {errors.holderId && <p className="text-[10px] text-rose-500 mt-1">{errors.holderId.message}</p>}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                    Kondisi Terkini <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { value: "BAIK", label: "Baik (B)", color: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400" },
                      { value: "KURANG_BAIK", label: "Kurang Baik (KB)", color: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-400" },
                      { value: "RUSAK_BERAT", label: "Rusak Berat (RB)", color: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-400" }
                    ].map((kondisi) => (
                      <label 
                        key={kondisi.value}
                        className={\`relative flex cursor-pointer rounded-lg border \${watchKondisi === kondisi.value ? \`ring-2 ring-emerald-500 \${kondisi.color}\` : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900'} p-3 shadow-sm focus:outline-none\`}
                      >
                        <input
                          type="radio"
                          value={kondisi.value}
                          {...register("kondisi")}
                          disabled={disableFields}
                          className="sr-only"
                        />
                        <span className="flex flex-1">
                          <span className="flex flex-col">
                            <span className="block text-sm font-medium">{kondisi.label}</span>
                          </span>
                        </span>
                        {watchKondisi === kondisi.value && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        )}
                      </label>
                    ))}
                  </div>
                  {errors.kondisi && <p className="text-[10px] text-rose-500 mt-1">{errors.kondisi.message}</p>}
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Catatan Tambahan
                  </label>
                  <textarea
                    placeholder="Contoh: Didanai oleh dana APBD 2026, Penempatan di ruang Aula utama."
                    rows={4}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    {...register("catatan")}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>`;

const tabHeaders = `      {/* Tabs Navigation */}
      <div className="flex border-b border-zinc-200 overflow-x-auto hide-scrollbar mb-6">
        <button
          type="button"
          onClick={() => setActiveTab("utama")}
          className={\`py-2.5 px-4 font-semibold text-sm border-b-2 transition-colors cursor-pointer whitespace-nowrap \${
            activeTab === "utama"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-zinc-800 hover:text-zinc-950"
          }\`}
        >
          Data Utama
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("spesifikasi")}
          className={\`py-2.5 px-4 font-semibold text-sm border-b-2 transition-colors cursor-pointer whitespace-nowrap \${
            activeTab === "spesifikasi"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-zinc-800 hover:text-zinc-950"
          }\`}
        >
          Spesifikasi & Atribut
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("penempatan")}
          className={\`py-2.5 px-4 font-semibold text-sm border-b-2 transition-colors cursor-pointer whitespace-nowrap \${
            activeTab === "penempatan"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-zinc-800 hover:text-zinc-950"
          }\`}
        >
          Penempatan & Kondisi
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">`;

const path = "src/app/(dashboard)/assets/AssetFormClient.tsx";
let content = fs.readFileSync(path, "utf-8");

// 1. Inject state
if (!content.includes("activeTab")) {
  content = content.replace(
    "const [deletePhotoIds, setDeletePhotoIds] = React.useState<string[]>([]);",
    "const [deletePhotoIds, setDeletePhotoIds] = React.useState<string[]>([]);\n  const [activeTab, setActiveTab] = React.useState(\"utama\");"
  );
}

// 2. Replace everything from `<form...>` to `{/* Image Upload`
const startForm = content.indexOf("<form onSubmit={handleSubmit(onSubmit)} className=\"grid grid-cols-1 lg:grid-cols-3 gap-6\">");
const endFormCol = content.indexOf("{/* Image Upload Sidebar (Right) */}");

if (startForm !== -1 && endFormCol !== -1) {
  content = content.substring(0, startForm) + tabHeaders + "\n" + formContent + "\n\n        " + content.substring(endFormCol);
} else {
  console.log("Could not find boundaries.");
  process.exit(1);
}

fs.writeFileSync(path, content);
console.log("DONE!");
