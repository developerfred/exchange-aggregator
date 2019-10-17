const toHexString = (byteArray: number[]) => {
  return Array.from(byteArray, byte => {
    const value = (byte & 0xff).toString(16);
    return `0${value}`.slice(-2);
  }).join('');
};

export const bytesToHex = (byteArray: number[]) => {
  return `0x${toHexString(byteArray)}`;
};
