import React from 'react';
import { User } from '../../types';
import { ShieldCheck, Star, Calendar, Truck, Heart, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

interface HostProfileCardProps {
  host: User;
  spotId: string;
  onMessageHost: () => void;
}

export const HostProfileCard: React.FC<HostProfileCardProps> = ({
  host,
  spotId,
  onMessageHost,
}) => {
  return (
    <Card className="p-6 sm:p-8 border-border bg-card shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl ring-2 ring-primary/20">
              <AvatarImage src={host.avatar} alt={host.name} className="object-cover" />
              <AvatarFallback className="rounded-3xl font-bold text-lg bg-primary/10 text-primary">
                {host.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {host.verifications.idDocument && (
              <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-full shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-extrabold text-foreground">{host.name}</h3>
              <Badge variant="sage" className="text-[10px]">Verified Host</Badge>
            </div>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">
              Host in {host.homeRegion} · Joined {host.joinedYear}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs font-bold text-foreground">
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{host.rating}</span>
                <span className="text-muted-foreground font-normal">({host.reviewCount} reviews)</span>
              </span>
              <span>·</span>
              <span>{host.spotsHosted} stays hosted</span>
            </div>
          </div>
        </div>

        <Button
          onClick={onMessageHost}
          variant="outline"
          size="default"
          className="w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <MessageSquare className="w-4 h-4 text-primary" />
          <span>Message Host</span>
        </Button>
      </div>

      {/* Host Bio */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">About Your Host</h4>
        <p className="text-sm text-foreground/80 leading-relaxed">
          {host.bio}
        </p>
      </div>

      {/* Rig & Experience Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border flex items-center gap-3">
          <Truck className="w-5 h-5 text-primary shrink-0" />
          <div>
            <div className="text-[11px] font-bold text-muted-foreground uppercase">Host's Personal Rig</div>
            <div className="text-xs font-bold text-foreground">
              {host.rig.year} {host.rig.makeModel} ({host.rig.lengthFt} ft)
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border flex items-center gap-3">
          <Calendar className="w-5 h-5 text-primary shrink-0" />
          <div>
            <div className="text-[11px] font-bold text-muted-foreground uppercase">RV Journey</div>
            <div className="text-xs font-bold text-foreground">
              {host.yearsRVing} years roaming & hosting
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Trust & Verifications Pill Row */}
      <div className="flex flex-wrap gap-2 text-xs">
        {host.verifications.email && (
          <Badge variant="sage" className="gap-1.5 py-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Email Verified
          </Badge>
        )}
        {host.verifications.phone && (
          <Badge variant="sage" className="gap-1.5 py-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Phone Verified
          </Badge>
        )}
        {host.verifications.idDocument && (
          <Badge variant="sage" className="gap-1.5 py-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Government ID Verified
          </Badge>
        )}
        {host.verifications.rvOwnership && (
          <Badge variant="outdoor" className="gap-1.5 py-1">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Verified RV Owner
          </Badge>
        )}
      </div>
    </Card>
  );
};
