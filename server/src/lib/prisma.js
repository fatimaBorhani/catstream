import { PrismaClient } from '@prisma/client'

// یه نمونه‌ی واحد از PrismaClient که همه‌جای پروژه استفاده می‌شه - ساختن چندتا نمونه
// (مثلاً هر بار تو هر route فایل جدا) باعث اتصال‌های اضافه به دیتابیس می‌شه
const prisma = new PrismaClient()

export default prisma
