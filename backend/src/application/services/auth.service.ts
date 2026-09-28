import { ENV } from '../../infrastructure/config/env.js';
import { adminAuth } from '../../infrastructure/config/firebaseAdmin.js';
import { TokenService } from '../../infrastructure/security/tokenService.js';
import { userRepository } from '../../infrastructure/repositories/MemoryUserRepository.js';
import { UserProfile, AuthResponse } from '../../domain/entities/User.js';
import { AppError } from '../../domain/errors/AppError.js';
import { RegisterDTO, LoginDTO } from '../dtos/auth.dto.js';

export class AuthService {
  /**
   * Registro con Email y Password vía Firebase Identity Toolkit REST API
   */
  static async register(data: RegisterDTO): Promise<AuthResponse> {
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
        throw AppError.conflict('El correo electrónico ya se encuentra registrado.');
      } else if (errorCode === 'WEAK_PASSWORD : Password should be at least 6 characters') {
        throw AppError.badRequest('La contraseña debe tener al menos 6 caracteres.');
      }
      throw AppError.badRequest(signUpData?.error?.message || 'Error al registrar el usuario.');
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

    await userRepository.save(userProfile, idToken);
    const token = TokenService.generateAccessToken(userProfile);

    return {
      user: userProfile,
      tokens: { accessToken: token, expiresIn: ENV.JWT_EXPIRES_IN },
    };
  }

  /**
   * Inicio de sesión con Email y Password vía Firebase Identity Toolkit REST API
   */
  static async login(data: LoginDTO): Promise<AuthResponse> {
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
        throw AppError.unauthorized('Correo o contraseña incorrectos.');
      } else if (errorCode === 'USER_DISABLED') {
        throw AppError.forbidden('Esta cuenta ha sido inhabilitada.');
      }
      throw AppError.unauthorized('Credenciales inválidas o usuario no encontrado.');
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
      console.warn('[AuthService] Advertencia al consultar perfil en Firestore:', err);
    }

    await userRepository.save(userProfile);
    const token = TokenService.generateAccessToken(userProfile);

    return {
      user: userProfile,
      tokens: { accessToken: token, expiresIn: ENV.JWT_EXPIRES_IN },
    };
  }

  /**
   * Inicio de sesión con Google (ID Token verification)
   * Soporta tanto Firebase ID Token (emitido por Firebase Client SDK)
   * como Google OAuth ID Token (emitido por Google Identity Provider / mobile)
   */
  static async loginWithGoogle(idToken: string, oauthToken?: string): Promise<AuthResponse> {
    if (!idToken) {
      throw AppError.badRequest('El token de autenticación es requerido.');
    }

    let uid = '';
    let email = '';
    let fullName = 'Usuario Google';
    let photoURL: string | null = null;
    let verified = false;

    // 1. Intentar verificar Firebase ID Token con Firebase Admin SDK
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      if (decoded && decoded.uid) {
        uid = decoded.uid;
        email = decoded.email || '';
        fullName = decoded.name || email.split('@')[0] || 'Usuario Google';
        photoURL = decoded.picture || null;
        verified = true;
      }
    } catch {
      // Continuar con verificación REST
    }

    // 2. Si no se verificó con Admin SDK, verificar Firebase ID Token mediante Identity Toolkit accounts:lookup REST API
    if (!verified) {
      try {
        const lookupUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${ENV.FIREBASE_API_KEY}`;
        const lookupResp = await fetch(lookupUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
        const lookupData: any = await lookupResp.json();

        if (lookupResp.ok && lookupData.users && lookupData.users.length > 0) {
          const user = lookupData.users[0];
          uid = user.localId;
          email = user.email || '';
          fullName = user.displayName || user.providerUserInfo?.[0]?.displayName || email.split('@')[0] || 'Usuario Google';
          photoURL = user.photoUrl || user.providerUserInfo?.[0]?.photoUrl || null;
          verified = true;
        }
      } catch {
        // Continuar con verificación de IdP directo
      }
    }

    // 3. Si se proporcionó oauthToken o si idToken es un Google OAuth ID token directo, verificar vía signInWithIdp
    if (!verified) {
      const tokenToVerify = oauthToken || idToken;
      try {
        const signInWithIdpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${ENV.FIREBASE_API_KEY}`;
        const idpResponse = await fetch(signInWithIdpUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postBody: `id_token=${tokenToVerify}&providerId=google.com`,
            requestUri: 'http://localhost:5000',
            returnSecureToken: true,
          }),
        });

        const idpData: any = await idpResponse.json();
        if (idpResponse.ok && idpData.localId) {
          uid = idpData.localId;
          email = idpData.email || '';
          fullName = idpData.displayName || email.split('@')[0] || 'Usuario Google';
          photoURL = idpData.photoUrl || null;
          verified = true;
        }
      } catch {
        // Falló verificación
      }
    }

    if (!verified || !uid) {
      throw AppError.unauthorized('Token de Google no válido o expirado.');
    }

    const userProfile: UserProfile = {
      uid,
      email,
      fullName,
      photoURL,
      provider: 'google',
      createdAt: new Date().toISOString(),
    };

    await userRepository.save(userProfile, idToken);
    const token = TokenService.generateAccessToken(userProfile);

    return {
      user: userProfile,
      tokens: { accessToken: token, expiresIn: ENV.JWT_EXPIRES_IN },
    };
  }

  /**
   * Obtener perfil del usuario por UID (con fallback en memoria, JWT claims y Firebase Admin)
   */
  static async getProfile(uid: string, fallbackUser?: Partial<UserProfile>): Promise<UserProfile> {
    const user = await userRepository.findById(uid);
    if (user) {
      return user;
    }

    // Fallback con datos verificados del JWT en la sesión activa
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
      await userRepository.save(profile);
      return profile;
    }

    throw AppError.notFound('Usuario no encontrado');
  }
}
