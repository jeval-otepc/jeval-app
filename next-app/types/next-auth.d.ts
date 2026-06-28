import "next-auth"

declare module "next-auth" {
  interface Session {
    strapiJwt?: string
    strapiUser?: any
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    strapiJwt?: string
    strapiUser?: any
  }
}