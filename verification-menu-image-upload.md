# Menu image upload verification

## Implemented workflow

Kitchen and Admin users can now select JPEG, PNG, or WebP files from their device in the live **Manage menu** form. The public URL-only image field is removed. The server validates the file type, size, and signature before persisting the object in the public Supabase Storage `menu-images` bucket.

## Current evidence

The local shared upload helper successfully persisted a valid PNG to Supabase Storage, and the live Vercel Kitchen form displays the new file picker with the 5 MB and supported-type guidance. An initial live WebP selection entered the upload state but did not render a preview after the request completed. Production API logs are being inspected before the workflow is marked as fully verified.

Render logs show that the first WebP attempt occurred while the service was redeploying. The updated API finished starting at 06:52:37 and became live at 06:52:40, after the attempted upload. The live upload is therefore being repeated against the confirmed running deployment.

## Successful production verification

The repeated live upload succeeded after the Render service was live. The Kitchen form rendered a preview from the returned Supabase Storage public URL under `menu-images/staff/1/...webp`. This confirms device selection, Kitchen-authenticated upload, server validation, object persistence, and public catalog-compatible delivery. The stored object was also independently retrieved with HTTP 200 and `image/png` content type during the Storage verification. No test product was created, so the public catalog was not modified during this check.

A clearly labelled temporary product, `Image Upload Verification Dish`, was then saved through the live Kitchen form using the uploaded WebP image. The public Menu displayed both that exact name and the stored Supabase Storage image URL, confirming customer-catalog rendering. The product was immediately soft-deactivated with the narrowly scoped cleanup script; a fresh public Menu load confirmed it was no longer listed or orderable.
