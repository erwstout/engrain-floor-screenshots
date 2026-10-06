// In-memory stand-in for FileSystemDirectoryHandle; records written paths.
export const createMockDir = (name = "out", written: string[] = [], prefix = "") => {
  const dir = {
    name,
    written,
    getDirectoryHandle: async (child: string) => createMockDir(child, written, `${prefix}${child}/`),
    getFileHandle: async (file: string) => ({
      createWritable: async () => ({
        write: async () => undefined,
        close: async () => {
          written.push(`${prefix}${file}`);
        },
      }),
    }),
  };
  return dir as unknown as FileSystemDirectoryHandle & { written: string[] };
};
