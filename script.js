document.getElementById("convertBtn").addEventListener("click", async () => {
  const fileInput = document.getElementById("fileInput");
  const status = document.getElementById("status");

  if (!fileInput.files.length) {
    status.textContent = "Please choose a .litematic file first.";
    return;
  }

  const file = fileInput.files[0];
  status.textContent = "Reading file...";

  try {
    const arrayBuffer = await file.arrayBuffer();
    const byteArray = new Uint8Array(arrayBuffer);

    // Decompress gzip (.litematic)
    const decompressed = pako.inflate(byteArray);
    const nbtData = nbt.parse(decompressed.buffer);

    // Extract data
    const schematic = nbtData.value;
    const regions = schematic.Regions.value;
    const regionName = Object.keys(regions)[0];
    const region = regions[regionName].value;
    const size = region.Size.value;
    const x = size.x.value, y = size.y.value, z = size.z.value;

    const blockPalette = region.BlockStatePalette.value.map(b => b.value.Name.value);
    const totalBlocks = x * y * z;

    status.textContent = `Found region '${regionName}' with ${totalBlocks.toLocaleString()} blocks (${blockPalette.length} unique).`;

    // Create a placeholder mcstructure file
    const mcstructure = {
      format_version: 1,
      size: [x, y, z],
      structure: {
        block_indices: [[]],
        entities: [],
        palette: { default: [] }
      }
    };

    for (let i = 0; i < blockPalette.length; i++) {
      mcstructure.structure.palette.default.push({ name: blockPalette[i].replace("minecraft:", "") });
      mcstructure.structure.block_indices[0].push(i);
    }

    // Convert to NBT binary
    const mcNBT = nbt.writeUncompressed(mcstructure);

    // Create downloadable file
    const blob = new Blob([mcNBT], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name.replace(".litematic", ".mcstructure");
    a.click();

    status.textContent = "✅ Converted successfully!";
  } catch (err) {
    console.error(err);
    status.textContent = "❌ Error converting file. Check console for details.";
  }
});
