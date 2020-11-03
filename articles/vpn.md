# Raspberry Pi Home VPN Server

## Supplies Required

- Raspberry Pi connected via ethernet
- SD card to install on
- A domain name
- A network device

## Configuring the Pi

1. Install CentOS:
[ARM64 CentOS Image](https://github.com/raspberrypi/linux)
2. Update CentOS:
`yum update`
(I'd use CentOS 8, but that relies on epel, which isn't supported on Arm64
devices, but that hardly affects this project)
3. Enable SSH
4. Add user
5. Security tweaks
6. Probably resize the SD card partition

```bash
growpart /dev/mmcblk0 4
resize2fs /dev/mmcblk0p4
```

## Configuring the Network

1. Reserve IP address
2. Forward port 1194

## Configuring Dynamic DNS

1. Set up DDClient

## Configuring Firewall

```bash
#Enable IP forwarding
echo 1  /proc/sys/net/ipv4/ip_forward

nano /etc/sysctl.conf
#uncomment net.ipv4.ip_forward=1
#save and exit

ufw status
ufw allow ssh
ufw allow 1194/udp

#Let packets forward through the VPS by changing for forward policy to accept

nano /etc/default/ufw
#replace DROP with ACCEPT in DEFAULT_FORWARD_POLICY="DROP"
#save and exit

#Enable NAT and IP masquerading for clients
nano /etc/ufw/before.rules
#Add the following near the top
*nat
:POSTROUTING ACCEPT [0:0] 
-A POSTROUTING -s 10.8.0.0/8 -o eth0 -j MASQUERADE
COMMIT

ufw status
```

## Configuring OpenVPN

```bash
apt-get update; apt-get install openvpn easy-rsa

gunzip -c /usr/share/doc/openvpn/examples/sample-config-files/server.conf.gz  /etc/openvpn/server.conf

nano /etc/openvpn/server.conf 

replace dh1024.pem with dh2048.pem
#uncomment push "redirect-gateway def1 bypass-dhcp"
#uncomment push "dhcp-option DNS" and replace IP addresses with your fav DNS
#uncomment user nobody
#uncomment group nogroup
#save and exit
```

## Configure Cryptography
```bash
cp -r /usr/share/easy-rsa/ /etc/openvpn
mkdir /etc/openvpn/easy-rsa/keys

nano /etc/openvpn/easy-rsa/vars
#change export KEY_* values
#set KEY_NAME to "server"
#save and exit

#Generate the 2048 bit Diffie-Hellman pem file we pointed to in the openvpn config
openssl dhparam -out /etc/openvpn/dh2048.pem 2048

#move to the easy-rsa directory

cd /etc/openvpn/easy-rsa

#Set the variables we configured
. ./vars
./clean-all
./build-ca #Accept all defaults 
./build-key-server server #Accept all defaults 

#Move the newly generated certificates to /etc/openvpn
cp /etc/openvpn/easy-rsa/keys/server.crt,server.key,ca.crt /etc/openvpn

#In /etc/openvpn we should have a server.conf, server.crt, server.key, ca.crt and dh2048.pem

#start the OpenVPN service
service openvpn start
service openvpn status

Setup keys for the first client

./build-key client
ls keys

#Make a new directory to merge the client configuration and keys
mkdir ~/client

#Copy the example client configuration renaming the file extension from conf to ovpn
cp /usr/share/doc/openvpn/examples/sample-config-files/client.conf ~/client/pineapple.ovpn

cd /etc/openvpn/easy-rsa/keys
cp client.crt client.key client.ovpn ~/client
cp /etc/openvpn/ca.crt ~/client

Securely copy client.crt, client.key, ca.crt and client.ovpn to your client device

cd ~/client

#determine public IP address
ifconfig

nano pineapple.ovpn
# find remote and replace my-server-1 with IP address of VPN server
# uncomment group nogroup
# uncomment user nobody
# comment out the ca, cert and key directives
# save and exit

echo "ca" to pineapple.ovpn
cat ca.crt to pineapple.ovpn
echo "/ca" to pineapple.ovpn

echo "cert" to pineapple.ovpn
cat client.crt to pineapple.ovpn
echo "/cert" to pineapple.ovpn

echo "key" to pineapple.ovpn
cat client.key to pineapple.ovpn
echo "/key" to pineapple.ovpn
```
