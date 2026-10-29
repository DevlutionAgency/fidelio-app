import { z } from 'zod';

export const LeadSchema = z.object({
  source: z.enum(['demo', 'simulateur', 'demarrer']).default('demo'),
  prenom: z
    .string()
    .trim()
    .min(2, 'Le prénom doit contenir au moins 2 caractères'),
  commerceName: z
    .string()
    .trim()
    .min(2, 'Le nom du commerce doit contenir au moins 2 caractères'),
  phone: z
    .string()
    .trim()
    .min(6, 'Veuillez saisir un numéro de téléphone valide'),
  email: z.string().trim().email('Email invalide').optional().or(z.literal('')),
  ville: z.string().trim().default('Alger'),
  pointsDeVente: z.string().trim().default('1'),
  rappelQuand: z.string().trim().default('Peu importe'),
  simClientsParJour: z.number().int().nonnegative().optional(),
  simPanierMoyen: z.number().int().nonnegative().optional(),
  simGainMensuelDzd: z.number().int().optional(),
});

export const RewardTierSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1, 'Le titre de la récompense est obligatoire'),
  cost: z.number().int().positive('Le palier doit être supérieur à 0'),
  description: z.string().default(''),
  category: z.string().default('Général'),
  redemptions: z.number().int().nonnegative().default(0),
});

export const RegisterMerchantSchema = z.object({
  name: z.string().trim().min(2, 'Le nom du commerce doit contenir au moins 2 caractères'),
  email: z.string().trim().email('Adresse email invalide'),
  phone: z.string().trim().min(6, 'Numéro de téléphone invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  category: z.string().trim().default('Restaurant'),
  address: z.string().trim().default('Alger'),
  mode: z.enum(['points', 'tampons']).default('tampons'),
});

export const LoginMerchantSchema = z.object({
  email: z.string().trim().email('Adresse email invalide'),
  password: z.string().min(1, 'Veuillez saisir votre mot de passe'),
});

export const UpdateProgramSchema = z.object({
  name: z.string().trim().min(1).optional(),
  programName: z.string().trim().min(1).optional(),
  currency: z.enum(['MAD', 'EUR']).optional(),
  category: z.string().trim().optional(),
  address: z.string().trim().optional(),
  mode: z.enum(['points', 'tampons']).optional(),
  pointsPerMad: z.number().int().positive().optional(),
  pointsPerDzd: z.number().int().positive().optional(),
  stampsPerVisit: z.number().int().positive().optional(),
  stampsTarget: z.number().int().positive().optional(),
  welcomeBonus: z.number().int().nonnegative().optional(),
  referralBonus: z.number().int().nonnegative().optional(),
  googleReviewBonus: z.number().int().nonnegative().optional(),
  googleReviewUrl: z.string().optional(),
  cardBgColor: z.string().optional(),
  cardAccentColor: z.string().optional(),
  cardCoverImage: z.string().optional(),
  cardLogoImage: z.string().optional(),
  geoNotificationText: z.string().optional(),
  rewards: z.array(RewardTierSchema).optional(),
});

export const JoinCustomerSchema = z.object({
  name: z.string().trim().min(2, 'Veuillez saisir votre prénom (min. 2 caractères)'),
  phone: z.string().trim().min(6, 'Veuillez saisir un numéro de téléphone valide'),
  email: z.string().trim().optional().default(''),
  walletAdded: z.enum(['apple', 'google', 'web']).default('web'),
  merchantSlug: z.string().trim().optional(),
  merchantId: z.string().trim().optional(),
});

export const ScanTransactionSchema = z.object({
  codeOrId: z.string().trim().min(2, 'Veuillez fournir un code client valide'),
  merchantId: z.string().trim().optional(),
  type: z.enum(['earn', 'redeem']).default('earn'),
  delta: z.number().int().positive('Le nombre de points/tampons doit être positif').default(1),
  amountDzd: z.number().nonnegative().optional(),
  rewardTitle: z.string().optional(),
  operator: z.string().trim().default('Caisse Principale'),
  reference: z.string().trim().optional(),
});
