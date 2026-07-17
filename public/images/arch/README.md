# Arch Linux Images Needed

Download these Arch Linux installation screenshots and place them in `public/images/arch/`.

## How to get the images

1. Boot from Arch Linux ISO in a VM (VirtualBox/VMware)
2. Take screenshots at each step
3. Save them as the filenames below

OR search for "Arch Linux install guide screenshots" and download from wiki/tutorials.

## Required Images

| Filename | What it shows | When to use |
|----------|--------------|-------------|
| `01-boot-menu.png` | Arch Linux boot menu (Boot Arch Linux x86_64) | Boot menu scene |
| `02-live-login.png` | Live environment login prompt | After booting into live |
| `03-keyboard.png` | `loadkeys us` command in terminal | Keyboard layout step |
| `04-efi-check.png` | `ls /sys/firmware/efi/efivars` output | UEFI check step |
| `05-ping.png` | `ping -c 3 archlinux.org` output | Network test step |
| `06-timedatectl.png` | `timedatectl` output | Clock sync step |
| `07-partition-cfdisk.png` | `cfdisk /dev/sda` partition editor | Disk partitioning step |
| `08-mkfs.png` | `mkfs.ext4 /dev/sda1` output | Format partitions step |
| `09-mount.png` | `mount /dev/sda1 /mnt` output | Mount partitions step |
| `10-pacstrap.png` | `pacstrap /mnt base linux linux-firmware` output | Package installation step |
| `11-fstab.png` | `genfstab -U /mnt >> /mnt/etc/fstab` output | Fstab generation step |
| `12-chroot.png` | `arch-chroot /mnt` output | Chroot step |
| `13-timezone.png` | `ln -sf /usr/share/zoneinfo/Asia/Kolkata /etc/localtime` output | Timezone step |
| `14-locale.png` | `locale-gen` output | Locale step |
| `15-hostname.png` | `echo mypc > /etc/hostname` output | Hostname step |
| `16-grub-install.png` | `grub-install --target=x86_64-efi` output | GRUB installation step |
| `17-grub-config.png` | `grub-mkconfig -o /boot/grub/grub.cfg` output | GRUB configuration step |
| `18-passwd.png` | `passwd` output | Root password step |
| `19-reboot.png` | `reboot` command | Reboot step |
| `20-boot-menu.png` | GRUB boot menu with Arch Linux | After reboot |

## Tips

- Use VirtualBox for screenshots (easy to capture)
- Resolution: 1024x768 or 1280x720
- Format: PNG preferred, WebP also works
- Keep file sizes small (< 200KB each)
- Crop to show just the terminal/window if needed
