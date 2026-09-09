import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { adminAuth, adminDb } from '../config/firebaseAdmin.js';
import { UserProfile, AuthResponse } from '../types/index.js';

// Cache en memoria para sesiones activas y perfiles
const usersStore = new Map<string, UserProfile>();

export class AuthService {
  private static generateToken(user: UserProfile): string {
    return jwt.sign(
      {
        uid: user.uid,
        email: user.email,
        fullName: user.fullName,
        provider: user.provider,
      },
      ENV.JWT_SECRET,
      { expiresIn: ENV.JWT_EXPIRES_IN as any }
    );
  }

  /**
   * Registro con Email y Password vía Firebase Identity Toolkit REST API
   */
  static async register(data: {
    fullName: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    password: string;
    acceptedTerms: boolean;
  }): Promise<AuthResponse> {
    const normalizedEmail = data.email.trim().toLowerCase();

    const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${ENV.FIREBASE_API_KEY}`;
    const signUpResponse = await fetch(signUpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: normalizedEmail,
        password: data.password,
        displayName: data.fullName.trim(),
        returnSecureToken: true,
      }),
    });

    const signUpData: any = await signUpResponse.json();

    if (!signUpResponse.ok) {
      const errorCode = signUpData?.error?.message;
      if (errorCode === 'EMAIL_EXISTS') {
        throw { status: 409, message: 'El correo electrónico ya se encuentra registrado.' };
      } else if (errorCode === 'WEAK_PASSWORD : Password should be at least 6 characters') {
        throw { status: 400, message: 'La contraseña debe tener al menos 6 caracteres.' };
      }
      throw { status: 400, message: signUpData?.error?.message || 'Error al registrar el usuario.' };
    }

    const uid = signUpData.localId;
    const idToken = signUpData.idToken;

    const userProfile: UserProfile = {
      uid,
      email: normalizedEmail,
      fullName: data.fullName.trim(),
      phone: data.phone || '',
      address: data.address || '',
      city: data.city || '',
      photoURL: null,
      provider: 'password',
      createdAt: new Date().toISOString(),
    };

    // Crear/actualizar documento en Firestore
    try {
      const fsUrl = `https://firestore.googleapis.com/v1/projects/${ENV.FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${uid}`;
      await fetch(fsUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          fields: {
            uid: { stringValue: userProfile.uid },
            email: { stringValue: userProfile.email },
            fullName: { stringValue: userProfile.fullName },
            phone: { stringValue: userProfile.phone || '' },
            address: { stringValue: userProfile.address || '' },
            city: { stringValue: userProfile.city || '' },
            provider: { stringValue: userProfile.provider },
            createdAt: { stringValue: userProfile.createdAt },
          },
        }),
      });
    } catch (err) {
      console.warn('Advertencia al guardar perfil en Firestore:', err);
    }

    usersStore.set(userProfile.uid, userProfile);
    const token = this.generateToken(userProfile);

    return {
      user: userProfile,
      tokens: { accessToken: token, expiresIn: ENV.JWT_EXPIRES_IN },
    };
  }

  /**
   * Inicio de sesión con Email y Password vía Firebase Identity Toolkit REST API
   */
  static async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const normalizedEmail = data.email.trim().toLowerCase();

    const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${ENV.FIREBASE_API_KEY}`;
    const signInResponse = await fetch(signInUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: normalizedEmail,
        password: data.password,
        returnSecureToken: true,
      }),
    });

    const signInData: any = await signInResponse.json();

    if (!signInResponse.ok) {
      const errorCode = signInData?.error?.message;
      if (errorCode === 'EMAIL_NOT_FOUND' || errorCode === 'INVALID_PASSWORD' || errorCode === 'INVALID_LOGIN_CREDENTIALS') {
        throw { status: 401, message: 'Correo o contraseña incorrectos.' };
      } else if (errorCode === 'USER_DISABLED') {
        throw { status: 403, message: 'Esta cuenta ha sido inhabilitada.' };
      }
      throw { status: 401, message: 'Credenciales inválidas o usuario no encontrado.' };
    }

    const uid = signInData.localId;
    const idToken = signInData.idToken;

    let userProfile: UserProfile = {
      uid,
      email: normalizedEmail,
      fullName: signInData.displayName || normalizedEmail.split('@')[0],
      photoURL: signInData.profilePicture || null,
      provider: 'password',
      createdAt: new Date().toISOString(),
    };

    // Intentar enriquecer datos con Firestore si existe documento
    try {
      const fsUrl = `https://firestore.googleapis.com/v1/projects/${ENV.FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${uid}`;
      const fsResp = await fetch(fsUrl, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (fsResp.ok) {
        const fsData: any = await fsResp.json();
        const fields = fsData.fields || {};
        userProfile = {
          uid,
          email: fields.email?.stringValue || userProfile.email,
          fullName: fields.fullName?.stringValue || userProfile.fullName,
          phone: fields.phone?.stringValue || '',
          address: fields.address?.stringValue || '',
          city: fields.city?.stringValue || '',
          photoURL: fields.photoURL?.stringValue || userProfile.photoURL,
          provider: (fields.provider?.stringValue as any) || 'password',
          createdAt: fields.createdAt?.stringValue || userProfile.createdAt,
        };
      }
    } catch (err) {
      console.warn('Advertencia al consultar perfil en Firestore:', err);
    }

    usersStore.set(userProfile.uid, userProfile);
    const token = this.generateToken(userProfile);

    return {
      user: userProfile,
      tokens: { accessToken: token, expiresIn: ENV.JWT_EXPIRES_IN },
    };
  }

  /**
   * Inicio de sesión con Google (ID Token verification)
   */
  static async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    const signInWithIdpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${ENV.FIREBASE_API_KEY}`;
    const idpResponse = await fetch(signInWithIdpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postBody: `id_token=${idToken}&providerId=google.com`,
        requestUri: 'http://localhost:5000',
        returnSecureToken: true,
      }),
    });

    const idpData: any = await idpResponse.json();

    if (!idpResponse.ok) {
      throw { status: 401, message: 'Token de Google no válido o expirado.' };
    }

    const uid = idpData.localId;
    const email = idpData.email || '';
    const fullName = idpData.displayName || 'Usuario Google';
    const photoURL = idpData.photoUrl || null;

    let userProfile: UserProfile = {
      uid,
      email,
      fullName,
      photoURL,
      provider: 'google',
      createdAt: new Date().toISOString(),
    };

    // Sincronizar en Firestore
    try {
      const fsUrl = `https://firestore.googleapis.com/v1/projects/${ENV.FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${uid}`;
      await fetch(fsUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idpData.idToken}`,
        },
        body: JSON.stringify({
          fields: {
            uid: { stringValue: uid },
            email: { stringValue: email },
            fullName: { stringValue: fullName },
            photoURL: { stringValue: photoURL || '' },
            provider: { stringValue: 'google' },
            createdAt: { stringValue: userProfile.createdAt },
          },
        }),
      });
    } catch (err) {
      console.warn('Advertencia al sincronizar Google en Firestore:', err);
    }

    usersStore.set(userProfile.uid, userProfile);
    const token = this.generateToken(userProfile);

    return {
      user: userProfile,
      tokens: { accessToken: token, expiresIn: ENV.JWT_EXPIRES_IN },
    };
  }

  /**
   * Obtener perfil del usuario por UID (con fallback en memoria, JWT claims y Firebase Admin)
   */
  static async getProfile(uid: string, fallbackUser?: Partial<UserProfile>): Promise<UserProfile> {
    // 1. Verificar cache en memoria (usuarios logueados o registrados recientemente)
    const cached = usersStore.get(uid);
    if (cached) {
      return cached;
    }

    // 2. Si Firebase Admin SDK está configurado con credenciales, consultar usuario
    if (ENV.FIREBASE_CLIENT_EMAIL && ENV.FIREBASE_PRIVATE_KEY) {
      try {
        const userRecord = await adminAuth.getUser(uid);
        let docData: any = {};
        try {
          const docSnap = await adminDb.collection('users').doc(uid).get();
          if (docSnap.exists) {
            docData = docSnap.data() || {};
          }
        } catch {
          // Si firestore falla, continuar con datos de auth
        }

        const profile: UserProfile = {
          uid: userRecord.uid,
          email: userRecord.email || fallbackUser?.email || '',
          fullName: docData.fullName || userRecord.displayName || fallbackUser?.fullName || 'Usuario',
          phone: docData.phone || userRecord.phoneNumber || fallbackUser?.phone || '',
          address: docData.address || fallbackUser?.address || '',
          city: docData.city || fallbackUser?.city || '',
          photoURL: docData.photoURL || userRecord.photoURL || fallbackUser?.photoURL || null,
          provider: (docData.provider as any) || (fallbackUser?.provider as any) || 'password',
          createdAt: docData.createdAt || userRecord.metadata?.creationTime || new Date().toISOString(),
        };

        usersStore.set(uid, profile);
        return profile;
      } catch (adminErr) {
        console.warn('[AuthService] Advertencia al consultar usuario en Firebase Admin:', adminErr);
      }
    }

    // 3. Fallback con datos verificados del JWT en la sesión activa
    if (fallbackUser && (fallbackUser.uid === uid || !fallbackUser.uid)) {
      const profile: UserProfile = {
        uid,
        email: fallbackUser.email || '',
        fullName: fallbackUser.fullName || fallbackUser.email?.split('@')[0] || 'Usuario',
        phone: fallbackUser.phone || '',
        address: fallbackUser.address || '',
        city: fallbackUser.city || '',
        photoURL: fallbackUser.photoURL || null,
        provider: (fallbackUser.provider as any) || 'password',
        createdAt: fallbackUser.createdAt || new Date().toISOString(),
      };
      usersStore.set(uid, profile);
      return profile;
    }

    throw { status: 404, message: 'Usuario no encontrado' };
  }
}
