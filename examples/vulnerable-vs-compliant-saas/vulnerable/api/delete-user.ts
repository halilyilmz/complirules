// Vulnerable Delete User API
export async function handler(req: any, res: any) {
  // TEHLİKELİ HATA 1: Ham req.body loglanıyor (Şifre, email, TCKN log sunucusuna sızıyor)
  console.log("Kullanıcı silme isteği alındı:", req.body);

  const { userId } = req.body;

  // TEHLİKELİ HATA 2: Hard delete ile kullanıcı ve ilişkili faturalar tamamen siliniyor
  // prisma.user.delete({ where: { id: userId } });

  return res.status(200).json({ success: true });
}
