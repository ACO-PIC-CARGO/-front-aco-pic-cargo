import { pickFirstOption, pickOption, searchAndPick } from "./fields.mjs";

const uniqueDocument = () => String(Date.now()).slice(-8);

export async function fillNewUserData(page, { email, password, confirmation = password }) {
  await pickFirstOption(page, "Tipo de Documento (*)");
  await page.getByLabel("Documento (*)", { exact: true }).fill(uniqueDocument());
  await page.getByLabel("Nombres (*)", { exact: true }).fill("Usuario");
  await page.getByLabel("Apellido Paterno (*)", { exact: true }).fill("Prueba");
  await page.getByLabel("Apellido Materno (*)", { exact: true }).fill("Ocho");
  await page.getByLabel("Teléfono (*)", { exact: true }).fill("999888777");
  await page.getByLabel("Correo (*)", { exact: true }).fill(email);
  await page.getByLabel("Clave*", { exact: true }).fill(password);
  await page.getByLabel("Confirmar Clave*", { exact: true }).fill(confirmation);
  await pickOption(page, "Sexo (*)", "Masculino");
  await searchAndPick(page, "Pais (*)", "Peru");
  await page.getByLabel("Dirección (*)", { exact: true }).fill("Av. Prueba 123");
}
